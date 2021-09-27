import { IIdentity } from '@monmedx/monmedx-common';
import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { Op, Sequelize, Transaction } from 'sequelize';
import {
  APPOINTMENT_REQUEST_FEATURE_REPOSITORY,
  APPOINTMENT_REQUEST_REPOSITORY,
  SEQUELIZE,
} from '../../common/constants';
import { AppointmentStatusEnum, AppointmentTypesEnum } from '../../common/enums';
import { ApptRequestStatusEnum } from '../../common/enums/appt-request-status.enum';
import { ApptRequestTypesEnum } from '../../common/enums/appt-request-types.enum';
import { AppointmentsService } from '../appointments/appointments.service';
import { LookupsService } from '../lookups/lookups.service';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';
import {
  AppointmentRequestCancelAppointmentDto,
  CreateAppointmentRequestDto,
  RejectAppointmentRequestDto,
  UpdateAppointmentRequestDto,
} from './dto';
import { featureStatusDto } from './dto/feature-status.dto';
import { AppointmentRequestFeatureStatusModel, AppointmentRequestsModel } from './models';
import { AppointmentEventPublisher, AppointmentsEventName } from '../appointments/appointments.event-publisher';
import { AppointmentRequestTypesLookupsModel } from '../lookups/models/appointment-request-types.model';

@Injectable()
export class AppointmentRequestsService {
  private readonly logger = new Logger(AppointmentRequestsService.name);

  constructor(
    @Inject(SEQUELIZE)
    private readonly sequelizeInstance: Sequelize,
    @Inject(APPOINTMENT_REQUEST_REPOSITORY)
    private readonly appointmentRequestsModel: typeof AppointmentRequestsModel,
    @Inject(APPOINTMENT_REQUEST_FEATURE_REPOSITORY)
    private readonly appointmentRequestFeatureStatusModel: typeof AppointmentRequestFeatureStatusModel,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
    private readonly lookupsService: LookupsService,
    private readonly eventPublisher: AppointmentEventPublisher,
  ) {}

  public async getRequestById(id: number, identity: IIdentity, transaction: Transaction) {
    this.logger.log({ function: 'getRequestById', id });
    const {
      userInfo: { patientIds, clinicIds },
      userId,
    } = identity;

    const apptRequest = await this.appointmentRequestsModel.findOne({
      where: {
        id,
        userId,
        patientId: {
          [Op.in]: patientIds,
        },
        clinicId: {
          [Op.in]: clinicIds,
        },
      },
      transaction,
    });
    if (!apptRequest) {
      throw new BadRequestException({
        fields: ['id'],
        code: '404',
        message: 'appointmentRequest not found',
      });
    }
    const clinicId = apptRequest.clinicId;
    identity.clinicId = clinicId;

    if (!clinicIds.includes(clinicId)) {
      throw new BadRequestException({
        fields: ['clinicId'],
        code: '401',
        message: 'You do not have permission',
      });
    }
    return apptRequest;
  }

  public async create(requestDto: CreateAppointmentRequestDto, identity: IIdentity, transaction: Transaction) {
    this.logger.log({ function: 'CreateAppointmentRequestDto', requestDto });

    const { userId } = identity;

    const { clinicId } = requestDto;
    identity.clinicId = clinicId;
    const baseCreate = { createdBy: userId, updatedBy: userId, clinicId };
    const { patientId } = requestDto;

    await this.checkPatientHasRequest(patientId, identity);

    //If patient has an existing appointment, attempting to schedule a new appointment should instead take him to a view of his existing appointment,
    // and there he can choose to request rescheduling or cancellation.

    const requestTypeId = !requestDto.originalAppointmentId ? 1 : 2; //SCHEDULE, RESCHEDULE
    const appt_status_Waitlist_id = await this.lookupsService.getStatusIdByCode(
      identity,
      AppointmentStatusEnum.WAIT_LIST,
    );

    //get patient upcoming appointment
    const upcomingAppointment = await this.appointmentsService.getAppointmentByPatientId(identity, patientId);
    const originalAppointmentId = upcomingAppointment?.id;
    if (requestDto.originalAppointmentId) {
      await this.checkIfCanRescheduleAppointment(upcomingAppointment, identity);

      if (requestDto.originalAppointmentId !== originalAppointmentId) {
        throw new BadRequestException({
          fields: ['originalAppointmentId'],
          code: 'Patient_has_appointment',
          message: 'originalAppointmentId not equal upcomingAppointment Id',
        });
      }
    }
    if (upcomingAppointment.appointmentStatusId !== appt_status_Waitlist_id && !requestDto.originalAppointmentId) {
      throw new BadRequestException({
        fields: ['originalAppointmentId'],
        code: 'Patient_has_appointment',
        message: 'Patient has an existing appointment',
        data: [{ upcomingAppointment }],
      });
    }

    const appointmentTypeId = await this.getAppointmentTypeIdByPatientId(patientId, identity);
    const request_status_PENDING_id = await this.lookupsService.getApptRequestStatusIdByCode(
      ApptRequestStatusEnum.PENDING,
      identity,
    ); //3
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

  public async update(requestDto: UpdateAppointmentRequestDto, identity: IIdentity, transaction: Transaction) {
    this.logger.log({ function: 'create', requestDto });

    const { userId } = identity;

    const baseUpdate = { updatedBy: userId };

    const data = {
      ...requestDto,
      ...baseUpdate,
    };

    await this.appointmentRequestsModel.update(
      { ...data },
      {
        where: {
          id: requestDto.id,
          userId,
        },
        transaction,
      },
    );
    return this.appointmentRequestsModel.findByPk(requestDto.id, { transaction });
  }

  public async cancelRequest(id: number, identity: IIdentity, transaction: Transaction) {
    this.logger.log({ function: 'cancelRequest', id });

    const { userId } = identity;
    const createdRequest = await this.appointmentRequestsModel.findOne({
      where: {
        id,
        userId,
      },
    });
    if (!createdRequest) {
      throw new BadRequestException({
        fields: ['id'],
        code: '404',
        message: 'NotFound',
      });
    }
    identity.clinicId = createdRequest.clinicId;

    const request_status_PENDING_id = await this.lookupsService.getApptRequestStatusIdByCode(
      ApptRequestStatusEnum.PENDING,
      identity,
    ); //3
    const request_status_CANCELED_id = await this.lookupsService.getApptRequestStatusIdByCode(
      ApptRequestStatusEnum.CANCELED,
      identity,
    ); //2
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

  public async cancelAppointment(
    requestDto: AppointmentRequestCancelAppointmentDto,
    identity: IIdentity,
    transaction: Transaction,
  ) {
    this.logger.log({ function: 'cancelAppointment', requestDto });

    const { appointmentId, cancelReason } = requestDto;

    const { userId } = identity;

    //get patient upcoming appointment
    const appointment = await this.appointmentsService.getAppointmentById(
      identity,
      appointmentId,
      { model: AppointmentStatusLookupsModel },
      transaction,
    );
    const clinicId = appointment.clinicId;
    identity.clinicId = clinicId;

    await this.checkIfCanRescheduleAppointment(appointment, identity);

    const request_status_PENDING_id = await this.lookupsService.getApptRequestStatusIdByCode(
      ApptRequestStatusEnum.PENDING,
      identity,
    ); //3
    const request_status_CANCELED_id = await this.lookupsService.getApptRequestStatusIdByCode(
      ApptRequestStatusEnum.CANCELED,
      identity,
    ); //2

    const request_type_CANCEL_id = await this.lookupsService.getApptRequestTypeIdByCode(
      ApptRequestTypesEnum.CANCEL,
      identity,
    ); //3

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
        requestTypeId: request_type_CANCEL_id, //CANCEL
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

  public async RejectAppointmentRequest(
    requestDto: RejectAppointmentRequestDto,
    identity: IIdentity,
    transaction: Transaction,
  ) {
    this.logger.log({ function: 'RejectAppointmentRequest', requestDto });

    const { id, rejectionReason } = requestDto;

    const { userId, clinicId } = identity;

    const appointmentRequest = await this.appointmentRequestsModel.findOne({
      where: {
        id,
        clinicId,
      },
      include: [
        {
          model: AppointmentRequestTypesLookupsModel,
          as: 'requestType',
        },
      ],
    });
    if (!appointmentRequest) {
      throw new BadRequestException({
        fields: ['id'],
        code: '404',
        message: 'NotFound',
      });
    }

    const appointmentId = appointmentRequest.originalAppointmentId;

    const request_status_REJECTED_id = await this.lookupsService.getApptRequestStatusIdByCode(
      ApptRequestStatusEnum.REJECTED,
      identity,
    ); //

    await this.appointmentRequestsModel.update(
      {
        requestStatusId: request_status_REJECTED_id,
        rejectionReason,
        updatedBy: userId,
        updatedAt: new Date(),
      },
      {
        where: {
          id: id,
        },
        transaction,
      },
    );

    await appointmentRequest.reload({ plain: true, transaction });

    //update original appointment
    await this.appointmentsService.updateAppointmentAddRequestData(
      appointmentId,
      { id: null, date: null },
      transaction,
    );

    const appointment = await this.appointmentsService.getAppointmentById(identity, appointmentId, null, transaction);
    const requestTypeCode: ApptRequestTypesEnum = appointmentRequest.requestType.code as ApptRequestTypesEnum;

    this.eventPublisher.publishAppointmentEvent(
      AppointmentsEventName.APPOINTMENT_REQUEST_DECLINED,
      appointment,
      null,
      null,
      { requestTypeCode: requestTypeCode, rejectionReason },
      identity,
    );

    return appointmentRequest;
  }

  public async featureStatus(requestDto: featureStatusDto, identity: IIdentity, transaction: Transaction) {
    this.logger.log({ function: 'featureStatusDto', requestDto });

    const { clinicId, doctorId } = requestDto;

    const result = await this.appointmentRequestFeatureStatusModel.findAll({
      where: {
        clinicId,
        doctorId: {
          [Op.or]: [null, doctorId || null],
        },
      },
      transaction,
    });

    let clinicEnabled = true;
    let doctorEnabled = true;

    if (result.length) {
      result.forEach((el) => {
        if (el.doctorId === null) {
          clinicEnabled = !!el.enabled;
        } else {
          doctorEnabled = !!el.enabled;
        }
      });
    }

    return !clinicEnabled ? false : doctorEnabled;
  }

  async handleAppointmentRequest(
    appointmentId: number,
    action: ApptRequestTypesEnum | null,
    fullfillmentAppointmentId: number | null,
    identity: IIdentity,
    transaction?: Transaction,
  ) {
    this.logger.log({ function: 'handleAppointmentRequest', appointmentId, action, fullfillmentAppointmentId });
    const appointment = await this.appointmentsService.getAppointmentById(
      identity,
      appointmentId,
      [{ model: AppointmentRequestsModel, as: 'appointmentRequest', required: false }],
      transaction,
    );

    if (!appointment.appointmentRequestId) {
      return false;
    }
    if (!action) {
      await this.updateAppointmentRequestStatus(
        appointment.appointmentRequestId,
        ApptRequestStatusEnum.CANCELED,
        fullfillmentAppointmentId,
        identity,
        transaction,
      );
    }

    if (
      [ApptRequestTypesEnum.SCHEDULE, ApptRequestTypesEnum.RESCHEDULE, ApptRequestTypesEnum.CANCEL].includes(action)
    ) {
      await this.updateAppointmentRequestStatus(
        appointment.appointmentRequestId,
        ApptRequestStatusEnum.FULLFILLED,
        fullfillmentAppointmentId,
        identity,
        transaction,
      );
    }

    if (action === ApptRequestTypesEnum.CANCEL) {
      const request_type_RESCHEDULE_id = await this.lookupsService.getApptRequestTypeIdByCode(
        ApptRequestTypesEnum.RESCHEDULE,
        identity,
      ); //2

      if (appointment.appointmentRequest.appointmentTypeId === request_type_RESCHEDULE_id) {
        await this.createUnfulfilledRequestForNextProvisional(appointment, identity, transaction);
      }
    }

    //update original appointment
    await this.appointmentsService.updateAppointmentAddRequestData(
      appointmentId,
      { id: null, date: null },
      transaction,
    );

    return true;
  }

  //===========================  Private Functions  ===========================

  protected async updateAppointmentRequestStatus(
    id: number,
    newStatusCode: ApptRequestStatusEnum,
    fullfillmentAppointmentId: number,
    identity: IIdentity,
    transaction: Transaction,
  ) {
    this.logger.log({ function: 'updateAppointmentRequestStatus', id, newStatusCode, fullfillmentAppointmentId });
    const target_status_id = await this.lookupsService.getApptRequestStatusIdByCode(newStatusCode, identity);

    await this.appointmentRequestsModel.update(
      {
        requestStatusId: target_status_id,
        fullfillmentAppointmentId,
        updatedBy: identity.userId,
        updatedAt: new Date(),
      },
      {
        where: {
          id,
        },
        transaction,
      },
    );
  }

  //creates another unfulfilled request on the next provisional appointment, request type = reschedule.
  protected async createUnfulfilledRequestForNextProvisional(
    appointment,
    identity: IIdentity,
    transaction: Transaction,
  ) {
    this.logger.log({ function: 'createUnfulfilledRequestForNextProvisional', appointment });
    const newAppointment = await this.appointmentsService.getAppointmentByPatientId(identity, appointment.patientId);
    if (newAppointment) {
      const request_status_PENDING_id = await this.lookupsService.getApptRequestStatusIdByCode(
        ApptRequestStatusEnum.PENDING,
        identity,
      ); //3

      const createdRequest = await this.appointmentRequestsModel.create(
        {
          requestStatusId: request_status_PENDING_id,
          originalAppointmentId: newAppointment.id,
          appointmentTypeId: newAppointment.appointmentTypeId,
          ...appointment.appointmentRequest,
        },
        {
          transaction,
        },
      );
      //update original appointment
      await this.appointmentsService.updateAppointmentAddRequestData(newAppointment.id, createdRequest, transaction);
    }
  }

  protected checkIfCanRescheduleAppointment(appointment, identity) {
    if (!appointment) {
      throw new BadRequestException({
        fields: ['id'],
        code: '404',
        message: 'NotFound',
      });
    }

    const {
      userInfo: { patientIds, clinicIds },
    } = identity;
    if (!patientIds.includes(appointment.patientId) || !clinicIds.includes(appointment.clinicId)) {
      throw new BadRequestException({
        fields: ['patientId'],
        code: '401',
        message: `No Permission`,
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
  }

  protected async checkPatientHasRequest(patientId: number, identity: IIdentity) {
    const {
      userInfo: { patientIds },
    } = identity;
    if (!patientIds.includes(patientId)) {
      throw new BadRequestException({
        fields: ['patientId'],
        code: '410',
        message: 'No Permission',
      });
    }

    const request_status_PENDING_id = await this.lookupsService.getApptRequestStatusIdByCode(
      ApptRequestStatusEnum.PENDING,
      identity,
    ); //3

    //Can only make a single request, cannot make additional requests to book an appointment if there is a pending request.
    const checkIfHasRequest = await this.appointmentRequestsModel.findOne({
      where: {
        patientId,
        requestStatusId: request_status_PENDING_id,
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
  protected async getAppointmentTypeIdByPatientId(patientId: number, identity: IIdentity) {
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
