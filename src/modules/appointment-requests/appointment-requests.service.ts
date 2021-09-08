import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { fn, Sequelize, Transaction } from 'sequelize';
import {
  AppointmentRequestCancelAppointmentDto,
  CreateAppointmentRequestDto,
  UpdateAppointmentRequestDto,
} from './dto';
import { IIdentity } from '@monmedx/monmedx-common';
import { AppointmentRequestsModel } from './models/appointment-requests.model';
import { APPOINTMENT_REQUEST_REPOSITORY, SEQUELIZE } from '../../common/constants';
import { AppointmentsService } from '../appointments/appointments.service';
import * as moment from 'moment';
import { LookupsService } from '../lookups/lookups.service';
import { AppointmentStatusEnum, AppointmentTypesEnum } from '../../common/enums';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';

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

  async create(requestDto: CreateAppointmentRequestDto, identity: IIdentity, transaction: Transaction) {
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
    const request_status_PENDING_id = 3; //PENDING
    const createdRequest = await this.appointmentRequestsModel.create(
      {
        requestTypeId,
        requestStatusId: request_status_PENDING_id,
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

  async cancelRequest(id: number, identity: IIdentity, transaction: Transaction) {
    this.logger.log({ function: 'cancelRequest', id });

    const { userId } = identity;
    const createdRequest = await this.appointmentRequestsModel.findByPk(id);

    //TODO check if patient has permission to cancel his appointment
    if (!createdRequest) {
      throw new BadRequestException({
        fields: ['id'],
        code: '404',
        message: 'NotFound',
      });
    }

    const request_status_PENDING_id = 3; //PENDING
    const request_status_CANCELED_id = 2; //CANCELED
    if (createdRequest.requestStatusId !== request_status_PENDING_id) {
      throw new BadRequestException({
        fields: ['requestStatusId'],
        code: '401',
        message: 'NotFound',
      });
    }

    await this.appointmentRequestsModel.update(
      {
        requestStatusId: request_status_CANCELED_id,
        updatedBy: userId,
        updatedAt: new Date(),
      },
      {
        where: {
          id,
        },
        transaction,
      },
    );

    //update related appointment
    await this.appointmentsService.updateAppointmentAddRequestData(
      createdRequest.originalAppointmentId,
      { id: null, date: null },
      transaction,
    );

    return createdRequest.reload({ transaction });
  }

  async cancelAppointment(
    requestDto: AppointmentRequestCancelAppointmentDto,
    identity: IIdentity,
    transaction: Transaction,
  ) {
    this.logger.log({ function: 'cancelAppointment', requestDto });

    const { appointmentId, cancelReason } = requestDto;

    const { userId, clinicId } = identity;
    //get patient upcoming appointment
    const appointment = await this.appointmentsService.getAppointmentById(
      identity,
      appointmentId,
      { model: AppointmentStatusLookupsModel },
      transaction,
    );

    //TODO check if patient has permission to cancel his appointment
    if (!appointment) {
      throw new BadRequestException({
        fields: ['id'],
        code: '404',
        message: 'NotFound',
      });
    }

    //Appointment has to be scheduled (scheduled, confirmed, reminded, checked-in, ready)
    const appointmentStatusCode = appointment?.status?.code;
    if (
      ![
        AppointmentStatusEnum.SCHEDULE,
        AppointmentStatusEnum.CONFIRM1,
        AppointmentStatusEnum.CONFIRM2,
        AppointmentStatusEnum.CHECK_IN,
        AppointmentStatusEnum.READY,
      ].includes(appointmentStatusCode as AppointmentStatusEnum)
    ) {
      throw new BadRequestException({
        fields: ['appointmentStatusId'],
        code: '401',
        message: `Cannot Cancel appointment with status: ${appointmentStatusCode}`,
      });
    }

    const request_status_PENDING_id = 3; //PENDING
    const request_status_CANCELED_id = 2; //CANCELED

    //Request to cancel the appointment to cancel any in-flight rescheduling request.
    if (appointment.appointmentRequestId) {
      const prevAppointmentRequest = await this.appointmentRequestsModel.findByPk(appointment.appointmentRequestId);
      if (prevAppointmentRequest.requestStatusId === request_status_PENDING_id) {
        await this.appointmentRequestsModel.update(
          {
            requestStatusId: request_status_CANCELED_id,
            updatedBy: userId,
            updatedAt: new Date(),
          },
          {
            where: {
              id: appointment.appointmentRequestId,
            },
            transaction,
          },
        );
      }
    }

    const baseCreate = { createdBy: userId, updatedBy: userId, clinicId };
    const createdRequest = await this.appointmentRequestsModel.create(
      {
        userId,
        clinicId: appointment.clinicId,
        patientId: appointment.patientId,
        requestTypeId: request_status_CANCELED_id, //CANCEL
        requestStatusId: request_status_PENDING_id, //PENDING
        originalAppointmentId: appointmentId,
        requestReason: cancelReason,
        ...baseCreate,
      },
      {
        transaction,
      },
    );

    //update original appointment
    await this.appointmentsService.updateAppointmentAddRequestData(appointmentId, createdRequest, transaction);

    return createdRequest;
  }

  //===========================  Private Functions  ===========================
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
}
