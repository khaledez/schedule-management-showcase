import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { Sequelize, Transaction } from 'sequelize';
import { CreateAppointmentRequestDto, RescheduleAppointmentRequestDto, UpdateAppointmentRequestDto } from './dto';
import { IIdentity } from '@monmedx/monmedx-common';
import { AppointmentRequestsModel } from './models/appointment-requests.model';
import { APPOINTMENT_REQUEST_REPOSITORY, SEQUELIZE } from '../../common/constants';
import { AppointmentsService } from '../appointments/appointments.service';
import * as moment from 'moment';
import { LookupsService } from '../lookups/lookups.service';
import { AppointmentStatusEnum, AppointmentTypesEnum } from '../../common/enums';

@Injectable()
export class AppointmentRequestsService {
  private readonly logger = new Logger(AppointmentRequestsService.name);

  constructor(
    @Inject(SEQUELIZE)
    private readonly sequelizeInstance: Sequelize,
    @Inject(APPOINTMENT_REQUEST_REPOSITORY)
    private readonly appointmentRequestsModel: typeof AppointmentRequestsModel,
    private readonly appointmentsService: AppointmentsService,
    private readonly lookupsService: LookupsService,
  ) {}

  async getRequestById(id: number, identity: IIdentity, transaction: Transaction) {
    this.logger.log({ function: 'getRequestById', id });

    const { clinicId } = identity;

    const apptRequest = await this.appointmentRequestsModel.findByPk(id, {
      transaction,
    });
    if (!apptRequest) {
      throw new BadRequestException({
        fields: ['id'],
        code: '404',
        message: 'appointmentRequest not found',
      });
    }
    if (clinicId !== apptRequest?.clinicId) {
      throw new BadRequestException({
        fields: ['clinicId'],
        code: '401',
        message: 'You do not have permission',
      });
    }
    return apptRequest;
  }

  async createScheduleAppointment(
    requestDto: CreateAppointmentRequestDto,
    identity: IIdentity,
    transaction: Transaction,
  ) {
    this.logger.log({ function: 'CreateAppointmentRequestDto', requestDto });

    const { clinicId, userId } = identity;

    const baseCreate = { createdBy: userId, updatedBy: userId, clinicId };
    const { patientId } = requestDto;

    await this.checkPatientHasRequest(patientId, clinicId);

    //If patient has an existing appointment, attempting to schedule a new appointment should instead take him to a view of his existing appointment,
    // and there he can choose to request rescheduling or cancellation.

    const requestTypeId = !requestDto.originalAppointmentId ? 1 : 2; //SCHEDULE, RESCHEDULE
    const appt_status_Waitlist_id = await this.lookupsService.getStatusIdByCode(
      identity,
      AppointmentStatusEnum.WAIT_LIST,
    );

    //get patient upcoming appointment
    const upcomingAppointment = await this.appointmentsService.getAppointmentByPatientId(identity, patientId);
    if (upcomingAppointment.appointmentStatusId !== appt_status_Waitlist_id && !requestDto.originalAppointmentId) {
      throw new BadRequestException({
        fields: ['originalAppointmentId'],
        code: 'Patient_has_appointment',
        message: 'Patient has an existing appointment',
        data: [{ upcomingAppointment }],
      });
    }
    const originalAppointmentId = upcomingAppointment.id;
    if (requestDto.originalAppointmentId && requestDto.originalAppointmentId !== originalAppointmentId) {
      throw new BadRequestException({
        fields: ['originalAppointmentId'],
        code: 'Patient_has_appointment',
        message: 'originalAppointmentId not equal upcomingAppointment Id',
      });
    }
    const appointmentTypeId = await this.getAppointmentTypeIdByPatientId(patientId, identity);

    const createdRequest = await this.appointmentRequestsModel.create(
      {
        requestTypeId,
        requestStatusId: 3, //PENDING
        originalAppointmentId,
        appointmentTypeId,
        userId,
        ...requestDto,
        ...baseCreate,
      },
      {
        transaction,
      },
    );

    //update original appointment
    await this.appointmentsService.updateAppointmentAddRequestData(originalAppointmentId, createdRequest, transaction);

    return createdRequest;
  }

  private async checkPatientHasRequest(patientId: number, clinicId: number) {
    //TODO check patientId in the clinic

    //Can only make a single request, cannot make additional requests to book an appointment if there is a pending request.
    const checkIfHasRequest = await this.appointmentRequestsModel.findOne({
      where: {
        patientId,
        clinicId,
        requestStatusId: 3, //PENDING
      },
    });
    if (checkIfHasRequest) {
      throw new BadRequestException({
        fields: ['originalAppointmentId'],
        code: 'Appointment_has_Pending_Request',
        message: 'Cannot make additional requests to book an appointment if there is a pending request',
      });
    }
  }
  private async getAppointmentTypeIdByPatientId(patientId: number, identity: IIdentity) {
    /**
     If this patient has had NO previous appointments whatsoever (new patient): Appointment Type = New.
     If this patient has had a previous appointment within the last 3 months, Appointment Type = Control Visit (FUP)
     If this patient has had a previous appointment anytime earlier than 3 months, Appointment type = Principal Visit. 
     */
    const appointmentTypes = await this.lookupsService.findAllAppointmentTypesLookups(identity);
    const appointmentTypesCodes = [];
    appointmentTypes.forEach((el) => {
      appointmentTypesCodes[el.code] = el.id;
    });

    const appintmentType_NEW = appointmentTypesCodes[AppointmentTypesEnum.NEW] || 0;
    const appintmentType_FUP = appointmentTypesCodes[AppointmentTypesEnum.FUP] || 0;
    const appintmentType_FUP_ECG = appointmentTypesCodes[AppointmentTypesEnum.FUP_ECG] || 0;

    const lastAppointment = await this.appointmentsService.getLastCompleteAppointment(patientId, identity);
    if (!lastAppointment) {
      return appintmentType_NEW;
    }

    const lastAppointmentDate = lastAppointment.startDate;
    const isWithin3Months: boolean = moment().add(-3, 'months').diff(lastAppointmentDate) < 0;
    if (isWithin3Months) {
      return appintmentType_FUP;
    }
    return appintmentType_FUP_ECG;
  }

  async update(requestDto: UpdateAppointmentRequestDto, identity: IIdentity, transaction: Transaction) {
    this.logger.log({ function: 'create', requestDto });

    const { clinicId, userId } = identity;

    const baseUpdate = { updatedBy: userId };

    const appointmentTypeId = 0;

    const data = {
      appointmentTypeId,
      ...requestDto,
      ...baseUpdate,
    };

    const createdRequest = await this.appointmentRequestsModel.update(
      { ...data },
      {
        where: {
          id: requestDto.id,
        },
        transaction,
      },
    );
    return createdRequest;
  }
}
