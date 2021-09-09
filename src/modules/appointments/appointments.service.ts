/* eslint-disable @typescript-eslint/ban-ts-comment */
import { FilterDateInputDto, Identity, IIdentity, PagingInfoInterface } from '@monmedx/monmedx-common';
import { FilterIdsInputDto } from '@monmedx/monmedx-common/src/dto/filter-ids-input.dto';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  APPOINTMENT_CHECKIN_STATUS_EVENT,
  APPOINTMENTS_REPOSITORY,
  AVAILABILITY_REPOSITORY,
  BAD_REQUEST,
  DEFAULT_EVENT_DURATION_MINS,
  MIN_TO_MILLI_SECONDS,
  PAGING_LIMIT_DEFAULT,
  PAGING_OFFSET_DEFAULT,
  SCHEDULE_MGMT_TOPIC,
  SEQUELIZE,
} from 'common/constants';
import {
  AppointmentStatusEnum,
  AppointmentVisitModeEnum,
  CancelRescheduleReasonCode,
  ErrorCodes,
  isInTimeGroup,
  TimeScopesEnum,
} from 'common/enums';
import { addMinutesToDate } from 'common/helpers/date-time-helpers';
import { DateTime } from 'luxon';
import { GetPatientAppointmentHistoryDto } from 'modules/appointments/dto/get-patient-appointment-history-dto';
import { CreateAvailabilityDto } from 'modules/availability/dto/create.dto';
import { AvailabilityModelAttributes } from 'modules/availability/models/availability.interfaces';
import { AvailabilityModel } from 'modules/availability/models/availability.model';
import { AppointmentStatusLookupsModel } from 'modules/lookups/models/appointment-status.model';
import { PatientInfoAttributes, PatientInfoModel } from 'modules/patient-info/patient-info.model';
import sequelize, { FindOptions, Op, QueryTypes, Sequelize, Transaction, WhereOptions } from 'sequelize';
import { AvailabilityService } from '../availability/availability.service';
import { LookupsService } from '../lookups/lookups.service';
import { AppointmentsModel, AppointmentsModelAttributes } from './appointments.model';
import { AdhocAppointmentDto } from './dto/appointment-adhoc.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateProvisionalAppointmentDto } from './dto/create-provisional-appointment-dto';
import { QueryAppointmentsByPeriodsDto } from './dto/query-appointments-by-periods.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import getInclusiveSQLDateCondition from './utils/get-whole-day-sql-condition';
import { getQueryGenericSortMapper } from './utils/sequelize-sort.mapper';
import { ChangeAssingedDoctorPayload } from '../../common/interfaces/change-assinged-doctor';
import { PatientInfoService } from '../patient-info';
import { Includeable } from 'sequelize/types/lib/model';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { snsTopic } = require('pubsub-service');

export interface AssociationFieldsSortCriteria {
  [key: string]: {
    relation?: string;
    column: string;
  };
}

interface AvailabilityBasicInfo {
  staffId?: number;
  availabilityId?: number;
  startDate?: string;
  durationMinutes?: number;
  appointmentTypeId?: number;
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  static readonly DATE_COLUMN = 'start_date';

  constructor(
    @Inject(SEQUELIZE)
    private readonly sequelizeInstance: Sequelize,
    @Inject(APPOINTMENTS_REPOSITORY)
    private readonly appointmentsRepository: typeof AppointmentsModel,
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: typeof AvailabilityModel,
    private readonly lookupsService: LookupsService,
    @Inject(forwardRef(() => AvailabilityService))
    private readonly availabilityService: AvailabilityService,
    @Inject(forwardRef(() => PatientInfoService))
    private readonly patientInfoSvc: PatientInfoService,
  ) {}

  private readonly associationFieldsSortNames: AssociationFieldsSortCriteria = {
    STATUS: {
      relation: 'status',
      column: 'code',
    },
    DATE: {
      column: AppointmentsService.DATE_COLUMN,
    },
  };

  public async userPatientsAppointments(
    identity: IIdentity,
    queryParams: QueryParamsDto,
    pagingFilter: PagingInfoInterface,
  ): Promise<[AppointmentsModelAttributes[], number]> {
    const { limit, offset } = pagingFilter || { limit: PAGING_LIMIT_DEFAULT, offset: PAGING_OFFSET_DEFAULT };
    const order = getQueryGenericSortMapper(queryParams.sort, this.associationFieldsSortNames);
    try {
      const {
        userInfo: { patientIds, clinicIds },
      } = identity;
      identity.clinicId = clinicIds[0];

      let where = await this.appointmentSearchWhere(queryParams, identity);
      const appt_status_Waitlist = await this.lookupsService.getStatusIdByCode(
        identity,
        AppointmentStatusEnum.WAIT_LIST,
      );
      delete where.upcomingAppointment;
      where = {
        ...where,
        patientId: {
          [Op.in]: patientIds,
        },
        clinicId: {
          [Op.in]: clinicIds,
        },
        [Op.or]: [
          { appointmentStatusId: { [Op.not]: appt_status_Waitlist } },
          { appointmentRequestId: { [Op.not]: null } },
        ],
      };
      if (queryParams.filter?.timeScope) {
        const appintmentFinalStatuses = await this.lookupsService.getFinalStatusIds(identity);
        const appointmentStatusIdFilter =
          queryParams.filter.timeScope === TimeScopesEnum.PAST
            ? {
                [Op.in]: appintmentFinalStatuses,
              }
            : {
                [Op.notIn]: appintmentFinalStatuses,
              };

        where = {
          ...where,
          appointmentStatusId: appointmentStatusIdFilter,
        };
      }
      const options: FindOptions = {
        include: [
          {
            all: true,
          },
        ],
        where,
        order,
        limit,
        offset,
      };
      const { rows: appointments } = await this.appointmentsRepository.findAndCountAll(options);
      const searchResult = await this.buildAppointmentConnectionResponse(appointments);

      return [searchResult, appointments.length];
    } catch (error) {
      this.logger.error({
        function: 'service/appt/findall catch error',
        error,
      });
      throw new BadRequestException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'Failed to find the appointments',
        error: error.message,
      });
    }
  }

  private async appointmentSearchWhere(queryParams, identity: IIdentity) {
    const where: any = {
      clinicId: identity.clinicId,
      deletedBy: null,
      upcomingAppointment: true,
    };
    if (queryParams.filter?.doctorId) {
      const staffIdWhereClause = this.getEntityIdWhereClause(queryParams.filter?.doctorId);
      where.staffId = staffIdWhereClause;
    }
    if (queryParams.filter?.appointmentStatusId) {
      const appointmentStatusIdWhereClause = await this.getAppointmentStatusIdWhereClause(
        identity,
        queryParams.filter.appointmentStatusId,
      );
      where.appointmentStatusId = appointmentStatusIdWhereClause;
    }
    if (queryParams.filter?.appointmentTypeId) {
      const appointmentTypeIdWhereClause = this.getEntityIdWhereClause(queryParams.filter?.appointmentTypeId);
      where.appointmentTypeId = appointmentTypeIdWhereClause;
    }
    if (queryParams.filter?.date) {
      const startDateWhereClause = this.getStartDateWhereClause(queryParams.filter?.date || {});
      where[Op.or] = [{ startDate: startDateWhereClause }, { appointmentRequestDate: startDateWhereClause }];
    }

    return where;
  }

  // TODO refactor this as well
  // eslint-disable-next-line complexity
  public async searchWithPatientInfo(
    identity: IIdentity,
    queryParams: QueryParamsDto,
    pagingFilter: PagingInfoInterface,
  ): Promise<[AppointmentsModelAttributes[], number]> {
    const { limit, offset } = pagingFilter || { limit: PAGING_LIMIT_DEFAULT, offset: PAGING_OFFSET_DEFAULT };
    const order = getQueryGenericSortMapper(queryParams.sort, this.associationFieldsSortNames);

    const patientInfoInclude = this.buildAppointmentIncludePatientOption(queryParams);
    try {
      const where = await this.appointmentSearchWhere(queryParams, identity);

      const options: FindOptions = {
        include: [
          {
            all: true,
          },
          {
            ...patientInfoInclude,
          },
        ],
        where,
        order,
        limit,
        offset,
      };
      const { rows: appointments } = await this.appointmentsRepository.findAndCountAll(options);

      const filterAppointments = appointments.filter((appointment) => {
        if (!queryParams?.filter?.time?.between) {
          return true;
        }
        const start = queryParams.filter.time.between[0];
        const end = queryParams.filter.time.between[1];
        return isInTimeGroup(appointment.startDate, { start, end });
      });
      const searchResult = await this.buildAppointmentConnectionResponse(filterAppointments);

      return [searchResult, filterAppointments.length];
    } catch (error) {
      this.logger.error({
        function: 'service/appt/findall catch error',
        error,
      });
      throw new BadRequestException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'Failed to find the appointments',
        error: error.message,
      });
    }
  }

  // eslint-disable-next-line complexity
  buildAppointmentIncludePatientOption(queryParams: QueryParamsDto) {
    let where: WhereOptions<PatientInfoModel> = {};

    if (queryParams?.filter?.displayPatientId?.contains) {
      where = {
        ...where,
        displayPatientId: { [Op.like]: `%${queryParams.filter.displayPatientId.contains}%` },
      };
    }


    if (queryParams?.filter?.patientFullName?.contains) {
      where = {
        ...where,
        fullName: { [Op.like]: `%${queryParams.filter.patientFullName.contains}%` },
      };
    }

    if (queryParams?.filter?.patientHealthPlanNumber?.contains) {
      where = {
        ...where,
        primaryHealthPlanNumber: { [Op.like]: `%${queryParams.filter.patientHealthPlanNumber.contains}%` },
      };
    }

    if (queryParams?.filter?.dob?.eq) {
      where = {
        ...where,
        dob: { [Op.eq]: queryParams.filter.dob.eq },
      };
    }

    if (queryParams?.filter?.patientDoctorId) {
      where = {
        ...where,
        doctorId: this.getEntityIdWhereClause(queryParams.filter?.patientDoctorId || { or: null }),
      };
    }

    return {
      model: PatientInfoModel,
      as: 'patient',
      where: where,
    };
  }

  // TODO: refactor filters mappers to a proper util class
  getEntityIdWhereClause(entity: FilterIdsInputDto) {
    if (entity && entity.in) {
      return { [Op.in]: entity.in };
    } else if (entity && entity.eq) {
      return { [Op.eq]: entity.eq };
    }
    return { [Op.notIn]: [] };
  }

  async getAppointmentStatusIdWhereClause(identity: IIdentity, entity: FilterIdsInputDto) {
    if (entity && entity.in) {
      return { [Op.in]: entity.in };
    } else if (entity && entity.eq) {
      return { [Op.eq]: entity.eq };
    }
    // get final states for appointments
    const idsToExclude = await this.lookupsService.getFinalStatusIds(identity);
    return { [Op.notIn]: idsToExclude };
  }

  getStartDateWhereClause(dateRange: FilterDateInputDto) {
    // Set endTime to 23:59:59 due to sequelize limitations
    if (dateRange.between) {
      dateRange.between[1].setUTCHours(23, 59, 59, 999);
      return { [Op.between]: dateRange.between };
    } else if (dateRange.eq) {
      const end = new Date(dateRange.eq.getTime());
      end.setUTCHours(23, 59, 59, 999);
      return { [Op.between]: [dateRange.eq, end] };
    }
    return { [Op.notIn]: [] };
  }

  async getPatientAppointmentHistory(
    identity: IIdentity,
    pagingFilter: PagingInfoInterface,
    payload: GetPatientAppointmentHistoryDto,
  ): Promise<any> {
    const { limit, offset } = pagingFilter || { limit: PAGING_LIMIT_DEFAULT, offset: PAGING_OFFSET_DEFAULT };
    const order = getQueryGenericSortMapper(payload.sort, this.associationFieldsSortNames);
    this.logger.log(order);
    try {
      const options: FindOptions = {
        include: [
          {
            all: true,
          },
        ],
        where: {
          patientId: payload.patientId,
          clinicId: identity.clinicId,
        },
        order,
        limit,
        offset,
      };
      const { rows: appointments, count } = await this.appointmentsRepository.findAndCountAll(options);
      const searchResult = await this.buildAppointmentConnectionResponse(appointments);
      return [searchResult, count];
    } catch (error) {
      this.logger.error({
        function: 'service/appt/findall catch error',
        error: error.message,
      });
      throw new BadRequestException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'Failed to find the appointments',
        error: error.message,
      });
    }
  }

  private async buildAppointmentConnectionResponse(appointments) {
    const appointmentsStatusIds: number[] = [];
    const appointmentsAsPlain = appointments.map((e) => {
      appointmentsStatusIds.push(e.status.id);
      return e.get({ plain: true });
    });

    const actions = await this.lookupsService.findAppointmentsActions(appointmentsStatusIds);

    return appointmentsAsPlain.map((appt: AppointmentsModel, i) => ({
      ...appt,
      previousAppointment: appt.previousAppointmentId,
      primaryAction: actions[i]?.nextAction ? actions[i].nextAction : [],
      secondaryActions: actions[i]?.secondaryActions ? actions[i].secondaryActions : [],
      provisionalAppointment: !appt.availabilityId,
    }));
  }

  /**
   * Create a new patient one and reschedule old active appointments
   * @param identity
   * @param dto
   * @param upcomingAppointment
   * @param rescheduleReasonId
   * @param rescheduleReasonText
   * @param transaction
   */
  createPatientAppointment(
    identity: IIdentity,
    dto: CreateAppointmentDto,
    upcomingAppointment: boolean,
    rescheduleReasonId: number,
    rescheduleReasonText: string,
    transaction?: Transaction,
  ): Promise<AppointmentsModel> {
    const procedureInTx = async (transaction: Transaction) => {
      await this.reschedulePatientAppointments(
        identity,
        dto.patientId,
        rescheduleReasonId,
        rescheduleReasonText,
        transaction,
      );
      return this.createAppointment(identity, dto, upcomingAppointment, transaction);
    };
    if (transaction) {
      return procedureInTx(transaction);
    }
    return this.appointmentsRepository.sequelize.transaction(procedureInTx);
  }

  async cancelAppointment(identity: IIdentity, cancelDto: CancelAppointmentDto, usedTransaction?: Transaction) {
    const appointment = await this.getAppointmentById(identity, cancelDto.appointmentId);
    const finalStatuses = await this.lookupsService.getFinalStatusIds(identity);
    if (finalStatuses.includes(appointment.appointmentStatusId)) {
      throw new BadRequestException({
        message: "Can't cancel appointment with final status",
        code: ErrorCodes.BAD_REQUEST,
      });
    }
    const cancelReason = await this.lookupsService.getCancelRescheduleReasonById(cancelDto.cancelReasonId);

    const transaction = usedTransaction ? usedTransaction : await this.sequelizeInstance.transaction();
    if (cancelReason.code === CancelRescheduleReasonCode.RELEASE_PATIENT) {
      const patientInfo = await this.patientInfoSvc.releasePatient(identity.clinicId, appointment.patientId);
      await this.releasePatientAppointments(patientInfo);
      return AppointmentsModel.findOne({ transaction, where: { id: appointment.id } });
    }

    return this.appointmentsRepository.sequelize.transaction(async (transaction: Transaction) => {
      await this.cancelPatientAppointments(
        identity,
        appointment.patientId,
        cancelReason.id,
        cancelDto.cancelReasonText,
        cancelDto.keepAvailabiltySlot,
        cancelDto.visitId,
        transaction,
      );

      return this.createAppointment(
        identity,
        {
          patientId: appointment.patientId,
          staffId: appointment.staffId,
          appointmentTypeId: appointment.appointmentTypeId,
          startDate: cancelDto.provisionalDate,
          durationMinutes: DEFAULT_EVENT_DURATION_MINS,
          appointmentVisitModeId: appointment.appointmentVisitModeId,
        },
        true,
        transaction,
      );
    });
  }

  async cancelPatientAppointments(
    identity: IIdentity,
    patientId: number,
    cancelReasonId: number,
    cancelText: string,
    keepAvailabilitySlot: boolean,
    visitId: number,
    transaction?: Transaction,
  ) {
    await this.lookupsService.getCancelRescheduleReasonById(cancelReasonId);
    const cancelReasons = (await this.lookupsService.getCancelReasons(identity)).map((reason) => reason.id);
    if (!cancelReasons.includes(cancelReasonId)) {
      throw new BadRequestException({
        message: 'Use only cancel reasons for cancelling appointments',
        code: ErrorCodes.BAD_REQUEST,
      });
    }
    const appointmentFinalStateIds: number[] = await this.lookupsService.getAppointmentFinalStateIds();
    const cancelStatus = await this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.CANCELED);

    const options = {
      transaction,
      where: {
        patientId,
        clinicId: identity.clinicId,
        appointmentStatusId: {
          [Op.notIn]: appointmentFinalStateIds,
        },
      },
    };

    const availabilities = (await AppointmentsModel.findAll(options))
      .filter((appointment) => appointment.availabilityId)
      .map((appointment) => appointment.availabilityId);

    let updateValues: any = {
      appointmentStatusId: cancelStatus,
      cancelRescheduleReasonId: cancelReasonId,
      cancelRescheduleText: cancelText,
      upcomingAppointment: false,
      updatedBy: identity.userId,
      canceledBy: identity.userId,
      canceledAt: new Date(),
    };

    if (visitId) {
      updateValues = {
        ...updateValues,
        visitId: visitId,
      };
    }
    await AppointmentsModel.update(updateValues, options);

    if (keepAvailabilitySlot !== false) {
      await AvailabilityModel.update(
        { isOccupied: false },
        { transaction, where: { id: { [Op.in]: availabilities } } },
      );
    } else {
      await AvailabilityModel.destroy({ transaction, where: { id: { [Op.in]: availabilities } } });
    }
  }

  async reschedulePatientAppointments(
    identity: IIdentity,
    patientId: number,
    rescheduleReasonId: number,
    rescheduleReasonText: string,
    transaction?: Transaction,
  ) {
    await this.lookupsService.getCancelRescheduleReasonById(rescheduleReasonId);
    const rescheduleReasons = (await this.lookupsService.getRescheduleReasons(identity)).map((reason) => reason.id);
    if (!rescheduleReasons.includes(rescheduleReasonId)) {
      throw new BadRequestException({
        message: 'Use only reschedule reasons for rescheduling appointments',
        code: ErrorCodes.BAD_REQUEST,
      });
    }
    const appointmentFinalStateIds: number[] = await this.lookupsService.getAppointmentFinalStateIds();
    const rescheduleStatus = await this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.RESCHEDULED);

    const options = {
      transaction,
      where: {
        patientId,
        clinicId: identity.clinicId,
        appointmentStatusId: {
          [Op.notIn]: appointmentFinalStateIds,
        },
      },
    };

    await AppointmentsModel.update(
      {
        appointmentStatusId: rescheduleStatus,
        cancelRescheduleReasonId: rescheduleReasonId,
        cancelRescheduleText: rescheduleReasonText,
        upcomingAppointment: false,
        updatedBy: identity.userId,
        canceledBy: identity.userId,
        canceledAt: new Date(),
      },
      options,
    );
  }

  async releasePatientAppointments(patientAttr: PatientInfoAttributes, transaction?: Transaction) {
    const { id: patientId, clinicId, statusCode } = patientAttr;
    const identity = {
      cognitoId: null,
      clinicId: clinicId,
      userLang: null,
      userId: null,
      userInfo: null,
    };
    const statusReleasedId = await this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.RELEASED);

    const appointmentFinalStateIds: number[] = await this.lookupsService.getAppointmentFinalStateIds();

    await this.appointmentsRepository.update(
      {
        appointmentStatusId: statusReleasedId,
        cancelRescheduleText: statusCode,
        upcomingAppointment: false,
      },
      {
        transaction,
        where: {
          patientId,
          clinicId,
          appointmentStatusId: {
            [Op.notIn]: [...appointmentFinalStateIds],
          },
        },
      },
    );
  }

  /**
   * Handles provisional or non-provisional appointment corresponding to patient
   * references to an availability slot (created if non-existent)
   * @param dto
   * @param identity
   * @param upcomingAppointment
   * @param transaction Passed incase we need to create an availability
   * @returns
   */
  createAppointment(
    identity: IIdentity,
    dto: CreateAppointmentDto,
    upcomingAppointment: boolean,
    transaction?: Transaction,
  ): Promise<AppointmentsModel> {
    /* 1. Validation */
    // 1.1 Appointment type id
    if (!(dto.availabilityId || (dto.appointmentTypeId && dto.startDate && dto.durationMinutes))) {
      const errorMessage =
        "You didn't provide availabilityId you must provide: startDate, durationMinutes and appointmentTypeId";
      this.logger.error({
        function: 'service/appointment/createAppointment',
        message: errorMessage,
      });
      throw new BadRequestException({
        fields: ['appointmentTypeId', 'startDate', 'durationMinutes', 'availabilityId'],
        message: errorMessage,
        code: BAD_REQUEST,
      });
    }

    this.logger.debug({ message: 'creating an appointment', dto });
    // This flow is seperated in a function because most of it requires a database transaction
    // eslint-disable-next-line complexity
    const validateInputThenArrangeAttributesAndCommit = async (transaction: Transaction) => {
      // 1 Appointment, Status, Visit Mode
      await this.validateLookupIds(identity, dto, transaction);
      // 1.1 Is provisional and patient has provisional
      const [isProvisional, provisionalAppointment] = await Promise.all([
        this.isProvisional(identity, dto),
        this.getPatientProvisionalAppointment(identity, dto.patientId, transaction),
      ]);

      if (isProvisional && provisionalAppointment) {
        const errorMessage = 'Patient already has a provisional appointment';
        this.logger.error({
          function: 'service/appointment/createAppointment',
          message: errorMessage,
        });
        throw new NotFoundException({
          fields: [],
          code: ErrorCodes.CONFLICTS,
          message: errorMessage,
        });
      }

      if (!isProvisional && !dto.staffId && !dto.availabilityId) {
        const errorMessage = 'Non provisional appointment requires a staffId';
        this.logger.error({
          function: 'service/appointment/createAppointment',
          message: errorMessage,
        });
        throw new BadRequestException({
          fields: [],
          code: ErrorCodes.BAD_REQUEST,
          message: errorMessage,
        });
      }

      if (isProvisional) {
        return this.createProvisionalAppointment(
          identity,
          {
            patientId: dto.patientId,
            staffId: dto.staffId,
            appointmentTypeId: dto.appointmentTypeId,
            startDate: new Date(dto.startDate),
            durationMinutes: dto.durationMinutes,
          },
          transaction,
        );
      }

      /* 2. Arrange attributes */
      const { availability, appointmentStatusId, appointmentVisitModeId } = await Promise.all([
        this.getAvailabilityOrCreateOne(identity, { ...dto }, transaction),
        this.getAppointmentVisitModeId(dto),
        this.getAppointmentStatusId(identity, dto),
      ]).then(([availability, appointmentVisitModeId, appointmentStatusId]) => ({
        availability,
        appointmentVisitModeId,
        appointmentStatusId,
      }));
      const provisionalDate: Date = provisionalAppointment ? provisionalAppointment.startDate : availability.startDate;

      // 3.2 create the appointment
      const createdAppointment = await this.appointmentsRepository.create(
        {
          ...dto,
          staffId: availability.staffId,
          appointmentTypeId: availability.appointmentTypeId,
          clinicId: identity.clinicId,
          createdBy: identity.userId,
          provisionalDate,
          startDate: availability.startDate,
          endDate: availability.endDate,
          durationMinutes: availability.durationMinutes,
          appointmentVisitModeId,
          appointmentStatusId,
          availabilityId: availability.id,
          upcomingAppointment,
        },
        { transaction },
      );

      if (dto.staffChangedPermanent) {
        //change assigned doctor
        await this.changePatientAssignedDoctor({
          patientId: dto.patientId,
          doctorId: dto.staffId,
          clinicId: identity.clinicId,
          appointmentId: createdAppointment.id,
          reason: 'createAppointment-staffChangedPermanent',
        });
      }

      return createdAppointment;
    };

    if (!transaction) {
      return this.appointmentsRepository.sequelize.transaction(validateInputThenArrangeAttributesAndCommit);
    }
    return validateInputThenArrangeAttributesAndCommit(transaction);
  }

  async changePatientAssignedDoctor(payload: ChangeAssingedDoctorPayload) {
    try {
      await this.patientInfoSvc.changeAssignedDoctor(payload);
    } catch (error) {
      this.logger.error(error, 'while changePatientAssignedDoctor', JSON.stringify(payload));
    }
  }

  /**
   * Checks if to-be created appointment is provisional
   * @returns True if status id corresponds to WAIT_LIST
   * @returns True if status id is not provided (DEFAULTS)
   */
  private async isProvisional(identity: IIdentity, dto: CreateAppointmentDto) {
    if (!dto.appointmentStatusId) {
      return true;
    }
    const waitStatusId = await this.lookupsService.getProvisionalAppointmentStatusId(identity);
    return waitStatusId === dto.appointmentStatusId;
  }

  /**
   * Returns availability attributes. creates one and returns if non existent
   * @param identity Used to create an availability if needed
   * @param data
   * @param transaction ^^
   */
  private async getAvailabilityOrCreateOne(
    identity: IIdentity,
    data: AvailabilityBasicInfo,
    transaction: Transaction,
  ): Promise<AvailabilityModelAttributes> {
    let availability: AvailabilityModelAttributes;
    if (data.availabilityId) {
      // Get availbility id data if provided
      availability = await this.availabilityService.findOne(data.availabilityId);
      if (availability && availability.isOccupied) {
        throw new BadRequestException({
          message: 'availability is already occupied, select another one',
          fields: ['availaiblityId'],
        });
      }
      // update availability to be occupied
      await this.availabilityService.markAvailabilityAsOccupied(identity, availability.id, transaction);
    } else {
      // Create availability on spot
      // startDate & durationMinutes are required if exists no availabilityId
      const availabilityAttributes: CreateAvailabilityDto = {
        isOccupied: true,
        appointmentTypeId: data.appointmentTypeId,
        staffId: data.staffId,
        durationMinutes: data.durationMinutes,
        startDate: data.startDate,
      };
      // Act
      availability = await this.availabilityService.createSingleAvailability(
        identity,
        availabilityAttributes,
        transaction,
      );
    }
    return availability;
  }

  /**
   * Validates in parallel appointment type, visitmodes, statuses
   * @param identity
   * @param dto
   * @param transaction
   */
  private async validateLookupIds(
    identity: IIdentity,
    dto: CreateAppointmentDto,
    transaction?: Transaction,
  ): Promise<void> {
    // TODO: Make it throw multiple errors
    const toValidate: Promise<void>[] = [];
    // Mode Type
    if (dto.appointmentVisitModeId) {
      toValidate.push(
        this.lookupsService.validateAppointmentVisitModes(identity, [dto.appointmentVisitModeId], transaction),
      );
    }
    // Statuses
    if (dto.appointmentStatusId) {
      toValidate.push(
        this.lookupsService.validateAppointmentStatuses(identity, [dto.appointmentStatusId], transaction),
      );
    }
    // Only validate appointment type if no availability is provided
    if (!dto.availabilityId) {
      // Appointment type
      toValidate.push(this.lookupsService.validateAppointmentsTypes(identity, [dto.appointmentTypeId], transaction));
    }
    await Promise.all(toValidate);
  }

  /**
   * Handles appointmentVisitModeId attribute
   * @param identity
   * @returns default id (IN_PERSON) or provided id
   */
  private getAppointmentVisitModeId({ appointmentVisitModeId }: CreateAppointmentDto): Promise<number> {
    if (appointmentVisitModeId) {
      return Promise.resolve(appointmentVisitModeId);
    }
    return this.lookupsService.getVisitModeByCode(AppointmentVisitModeEnum.IN_PERSON);
  }

  /**
   * Handles appointmentStatusId attribute
   * @param identity
   * @param dto
   * @returns default id (WAIT_LIST) or provided id
   */
  private getAppointmentStatusId(identity: IIdentity, dto: CreateAppointmentDto): Promise<number> {
    const id = dto.appointmentStatusId;
    if (id) {
      return Promise.resolve(id);
    }
    return this.lookupsService.getProvisionalAppointmentStatusId(identity);
  }

  async findOne(
    @Identity() identity: IIdentity,
    id: number,
    transaction?: Transaction,
  ): Promise<AppointmentsModelAttributes> {
    const appointment = await this.appointmentsRepository.unscoped().findByPk(id, {
      include: [
        {
          all: true,
        },
      ],
      transaction,
    });
    if (!appointment) {
      throw new NotFoundException({
        fields: [],
        code: ErrorCodes.NOT_FOUND,
        message: 'The appointment does not exits!',
      });
    }
    const provisionalStatusId = await this.lookupsService.getProvisionalAppointmentStatusId(identity);
    const appointmentAsPlain = appointment.get({ plain: true });
    const actions = await this.lookupsService.findAppointmentsActions([appointment.appointmentStatusId]);
    this.logger.debug({
      title: 'appointment actions',
      actions,
    });
    return {
      ...appointmentAsPlain,
      primaryAction: actions[0].nextAction,
      secondaryActions: actions[0].secondaryActions,
      provisionalAppointment: appointment.appointmentStatusId === provisionalStatusId,
    };
  }

  async patientHasProvisionalAppointment(identity: IIdentity, patientId: number): Promise<boolean> {
    const provitionals = await this.getPatientProvisionalAppointment(identity, patientId);
    this.logger.debug({
      function: 'checkPatientHasAProvisionalAppointment',
      provitionals,
      condition: !!provitionals && !!provitionals.id,
    });
    return !!provitionals && !!provitionals.id;
  }

  async createProvisionalAppointment(
    identity: IIdentity,
    dto: CreateProvisionalAppointmentDto,
    transaction?: Transaction,
  ) {
    await this.lookupsService.validateAppointmentsTypes(identity, [dto.appointmentTypeId]);

    if (await this.getPatientProvisionalAppointment(identity, dto.patientId, transaction)) {
      throw new BadRequestException({
        message: `Patient ${dto.patientId} already has a provisional appointment`,
        code: BAD_REQUEST,
      });
    }

    const appointment = await this.getPatientActiveAppointment(identity, dto.patientId, transaction);
    if (appointment) {
      throw new BadRequestException({
        message: `Patient ${dto.patientId} already has an active appointment ${appointment.id}`,
        code: BAD_REQUEST,
      });
    }

    const appointmentStatusId = await this.lookupsService.getProvisionalAppointmentStatusId(identity);

    return this.appointmentsRepository.create(
      {
        ...dto,
        staffId: dto.staffId,
        clinicId: identity.clinicId,
        createdBy: identity.userId,
        provisionalDate: dto.startDate,
        endDate: addMinutesToDate(dto.startDate, dto.durationMinutes),
        complaintsNotes: dto.complaintsNotes,
        appointmentStatusId,
        upcomingAppointment: true,
      },
      { transaction },
    );
  }

  /**
   * Get patient next provisional appointment
   * @param identity
   * @param patientId
   * @param transaction
   */
  async getPatientProvisionalAppointment(
    identity: IIdentity,
    patientId: number,
    transaction?: Transaction,
  ): Promise<AppointmentsModel> {
    const waitListStatusId = await this.lookupsService.getProvisionalAppointmentStatusId(identity);
    const options: FindOptions = {
      where: {
        deletedAt: null,
        patientId,
        appointmentStatusId: waitListStatusId,
      },
      transaction,
    };
    return this.appointmentsRepository.findOne(options);
  }

  async adhocAppointment(
    identity: IIdentity,
    appointmentData: AdhocAppointmentDto,
    transaction?: Transaction,
  ): Promise<AppointmentsModel> {
    this.logger.debug({
      function: 'appointment/adhocAppointment',
      identity,
      appointmentData,
    });

    const [finalStatusesIds, inProgressStatus, typeFUB, appointmentModeId, cancelReasonId] = await Promise.all([
      this.lookupsService.getFinalStatusIds(identity),
      this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.VISIT),
      this.lookupsService.getFUBAppointmentTypeId(identity),
      this.lookupsService.getVisitModeByCode(appointmentData.modeCode || AppointmentVisitModeEnum.IN_PERSON),
      this.lookupsService.getCancelRescheduleReasonByCode(identity, CancelRescheduleReasonCode.RELEASE_PATIENT),
    ]);

    const procedureInTx = async (transaction: Transaction) => {
      // 1. check if there is an already existing appointment set for today (open)
      let appointment = await this.appointmentsRepository.findOne({
        where: {
          clinicId: identity.clinicId,
          patientId: appointmentData.patientId,
          appointmentStatusId: { [Op.notIn]: finalStatusesIds },
          [Op.and]: sequelize.where(
            sequelize.fn('DATE', sequelize.col('start_date')),
            DateTime.fromJSDate(appointmentData.date).toISODate(),
          ),
        },
        transaction,
      });

      // 2. if there is an appointment, then use it
      if (appointment) {
        const startDate = DateTime.fromJSDate(appointmentData.date);
        const durationMinutes =
          appointment.durationMinutes > 0 ? appointment.durationMinutes : DEFAULT_EVENT_DURATION_MINS;
        appointment.actualStartDate = startDate.toJSDate();
        appointment.actualEndDate = startDate.plus({ minutes: durationMinutes }).toJSDate();
        appointment.updatedBy = identity.userId;
        appointment.appointmentStatusId = inProgressStatus;
        appointment.staffId = identity.userId;
        // make sure availability is created
        if (!appointment.availabilityId) {
          const availability = await this.availabilityService.createSingleAvailability(
            identity,
            {
              staffId: identity.userId,
              appointmentTypeId: appointment.appointmentTypeId,
              durationMinutes: durationMinutes,
              startDate: startDate.toISO(),
              isOccupied: true,
            },
            transaction,
          );
          appointment.availabilityId = availability.id;
        }

        await this.cancelPatientAppointments(
          identity,
          appointmentData.patientId,
          cancelReasonId,
          'Ad-hoc appointment initiated',
          false,
          null,
          transaction,
        );
        appointment = await appointment.save({ transaction });
      }

      // 3. if there is no appointment, create a new one, all other appointments will be cancelled
      else {
        appointment = await this.createPatientAppointment(
          identity,
          {
            appointmentStatusId: inProgressStatus,
            startDate: DateTime.fromJSDate(appointmentData.date).toISO(),
            durationMinutes: DEFAULT_EVENT_DURATION_MINS,
            patientId: appointmentData.patientId,
            appointmentTypeId: typeFUB,
            appointmentVisitModeId: appointmentModeId,
            staffId: identity.userId,
          },
          true,
          cancelReasonId,
          'Ad-hoc appointment initiated',
          transaction,
        );
      }

      return appointment;
    };

    if (transaction) {
      return procedureInTx(transaction);
    }
    return this.appointmentsRepository.sequelize.transaction(procedureInTx);
  }

  async getPatientActiveAppointment(
    identity: IIdentity,
    patientId: number,
    transaction?: Transaction,
  ): Promise<AppointmentsModel> {
    const statuses = await this.lookupsService.getActiveAppointmentsStatuses(identity);
    const options: FindOptions = {
      where: {
        clinicId: identity.clinicId,
        deletedAt: null,
        patientId,
        appointmentStatusId: {
          [Op.in]: statuses,
        },
      },
      transaction,
    };
    return this.appointmentsRepository.findOne(options);
  }

  rescheduleAppointment(identity: IIdentity, dto: RescheduleAppointmentDto): Promise<AppointmentsModelAttributes> {
    return this.appointmentsRepository.sequelize.transaction(
      // eslint-disable-next-line complexity
      async (transaction): Promise<AppointmentsModelAttributes> => {
        // 0. validate
        await Promise.all([
          this.lookupsService.validateAppointmentRescheduleReasons(identity, [dto.rescheduleReason]),
          this.lookupsService.validateAppointmentVisitModes(
            identity,
            dto.appointmentVisitModeId ? [dto.appointmentVisitModeId] : [],
            transaction,
          ),
          this.lookupsService.validateAppointmentsTypes(
            identity,
            dto.appointmentTypeId ? [dto.appointmentTypeId] : [],
            transaction,
          ),
        ]);

        // at least one of availabilityId & startDate must be there
        if (!dto.availabilityId && !dto.startDate) {
          throw new BadRequestException({
            message: `You need to provide one of the following: availabilityId, startDate`,
            fields: ['availabilityId', 'startDate'],
            error: 'BAD_REQUEST',
          });
        }

        // 1. fetch appointment
        const appointment = await this.getAppointmentById(
          identity,
          dto.appointmentId,
          { model: AvailabilityModel, required: true },
          transaction,
        );

        // 2. check if we need to change the doctor permanently
        let staffId = dto.staffId ?? appointment.staffId;
        if (dto.availabilityId) {
          const availability = await this.availabilityService.findOne(dto.availabilityId);
          staffId = availability.staffId;
        }
        if (dto.removeFutureAppointments) {
          // cancel all future appointments with the current doctor
          await this.cancelPatientAppointments(
            identity,
            appointment.patientId,
            dto.rescheduleReason,
            'doctor changed permanently',
            true,
            null,
            transaction,
          );
        }
        if (dto.staffChangedPermanent) {
          //change assigned doctor
          await this.changePatientAssignedDoctor({
            patientId: appointment.patientId,
            doctorId: staffId,
            clinicId: identity.clinicId,
            appointmentId: appointment.id,
            reason: 'rescheduleAppointment-staffChangedPermanent',
          });
        }

        // 3. cancel appointment and create a new appointment
        const scheduleStatusId = await this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.SCHEDULE);
        const rescheduleStatusId = await this.lookupsService.getStatusIdByCode(
          identity,
          AppointmentStatusEnum.RESCHEDULED,
        );
        const [cancelResult, createResult] = await Promise.all([
          AppointmentsModel.update(
            {
              appointmentStatusId: rescheduleStatusId,
              cancelRescheduleReasonId: dto.rescheduleReason,
              cancelRescheduleText: dto.rescheduleText,
              upcomingAppointment: false,
            },
            { where: { id: appointment.id }, transaction },
          ),
          // this will create an availability in the same time
          this.createAppointment(
            identity,
            {
              patientId: appointment.patientId,
              staffId: dto.staffId || appointment.staffId,
              appointmentStatusId: scheduleStatusId,
              appointmentVisitModeId: dto.appointmentVisitModeId ?? appointment.appointmentVisitModeId,
              appointmentTypeId: dto.appointmentTypeId ?? appointment.appointmentTypeId,
              availabilityId: dto.availabilityId,
              startDate: dto.startDate,
              durationMinutes: dto.durationMinutes,
            },
            true,
            transaction,
          ),
        ]);

        this.logger.debug({
          method: 'rescheduleAppointment',
          cancelResult,
          createResult,
        });

        return createResult;
      },
    );
  }

  async getAppointmentById(
    identity: IIdentity,
    appointmentId: number,
    include?: Includeable | Includeable[],
    transaction?: Transaction,
  ) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: appointmentId, clinicId: identity.clinicId },
      include,
      transaction: transaction,
    });
    if (!appointment) {
      throw new NotFoundException({
        fields: ['appointmentId'],
        message: `Appointment with id = ${appointmentId} not found`,
        code: ErrorCodes.NOT_FOUND,
      });
    }
    return appointment;
  }

  async completeAppointment(
    identity: IIdentity,
    appointmentId: number,
    visitId: number,
    documentId: string,
    transaction: Transaction,
  ) {
    const completeStatusId = await this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.COMPLETE);
    this.logger.debug({
      function: 'completeAppointment',
      completeStatusId,
    });
    return this.appointmentsRepository.unscoped().update(
      {
        appointmentStatusId: completeStatusId,
        updatedBy: identity.userId,
        visitId,
        visitSummaryDocumentId: documentId,
        upcomingAppointment: false,
      },
      {
        where: {
          id: appointmentId,
        },
        transaction,
      },
    );
  }

  updateAppointment(
    identity: IIdentity,
    appointmentId: number,
    updateDto: UpdateAppointmentDto,
  ): Promise<AppointmentsModelAttributes> {
    return this.appointmentsRepository.sequelize.transaction<AppointmentsModelAttributes>(
      async (transaction: Transaction) => {
        // 1. fetch appointment
        const appointment = await this.appointmentsRepository.findOne({
          transaction,
          where: { id: appointmentId, clinicId: identity.clinicId },
        });
        if (!appointment) {
          throw new NotFoundException({
            fields: ['appointmentId'],
            message: `Appointment with id = ${appointmentId} not found`,
            code: ErrorCodes.NOT_FOUND,
          });
        }

        // 2. validate lookups
        await Promise.all([
          this.lookupsService.validateAppointmentStatuses(
            identity,
            updateDto.appointmentStatusId ? [updateDto.appointmentStatusId] : [],
          ),
          this.lookupsService.validateAppointmentVisitModes(
            identity,
            updateDto.appointmentVisitModeId ? [updateDto.appointmentVisitModeId] : [],
          ),
          this.lookupsService.validateAppointmentsTypes(
            identity,
            updateDto.appointmentTypeId ? [updateDto.appointmentTypeId] : [],
          ),
        ]);

        try {
          // 3. update database
          const attributes = mapUpdateDtoToAttributes(identity, appointment, updateDto);
          this.logger.debug({ method: 'appointmentService/updateAppointment', updateDto, attributes });
          await this.appointmentsRepository.update(attributes, {
            where: {
              id: appointmentId,
            },
            transaction,
            returning: true,
          });
          const updatedAppt = (await this.appointmentsRepository.findByPk(appointmentId, { transaction })).get();
          this.logger.debug({ method: 'appointmentService/updateAppointment', updatedAppt });
          // 4. publish event if status changed to check in
          this.publishEventIfStatusMatches(
            identity,
            AppointmentStatusEnum.CHECK_IN,
            updatedAppt,
            updateDto,
            APPOINTMENT_CHECKIN_STATUS_EVENT,
          );
          return updatedAppt;
        } catch (error) {
          this.logger.error({
            method: 'appointmentService/updateAppointment',
            updateDto,
            message: error.message,
          });
          throw new InternalServerErrorException({
            code: ErrorCodes.INTERNAL_SERVER_ERROR,
            message: error.message,
          });
        }
      },
    );
  }

  async publishEventIfStatusMatches(
    identity: IIdentity,
    targetStatus: AppointmentStatusEnum,
    updatedAppointment: AppointmentsModelAttributes,
    inputDto: UpdateAppointmentDto,
    eventName: string,
  ) {
    if (!inputDto.appointmentStatusId) {
      return;
    }
    try {
      this.logger.debug({
        method: 'appointmentsService/publishEventIfStatusMatches',
        message: 'publishing event',
        updatedAppointment,
      });
      const targetStatusId = await this.lookupsService.getStatusIdByCode(identity, targetStatus);
      if (targetStatusId === inputDto.appointmentStatusId) {
        await snsTopic.sendSnsMessage(SCHEDULE_MGMT_TOPIC, {
          eventName,
          source: SCHEDULE_MGMT_TOPIC,
          clinicId: updatedAppointment.clinicId,
          patientId: updatedAppointment.patientId,
          data: updatedAppointment,
        });
      }
    } catch (error) {
      this.logger.error({
        method: 'appointmentsService/publishEventIfStatusMatches',
        error,
        inputDto,
        updatedAppointment,
      });
    }
  }

  // eslint-disable-next-line complexity
  readonly handleAppointmentCategoryFilter = (
    { filter = {} },
    logger: Logger,
  ): { name: string; filter: Record<string, unknown> } | Record<string, unknown> => {
    try {
      const filterName = 'appointmentCategory';
      const waitlist = 'WAITLIST';
      const appt = 'APPOINTMENT';
      const isApptCategoryFilterExist = Object.keys(filter).findIndex((e) => e === filterName) !== -1;
      logger.debug({
        function: 'handleAppointmentCategoryFilter START',
        filter,
        isApptCategoryFilterExist,
      });
      if (!isApptCategoryFilterExist) {
        return {};
      }
      const comingOperator: string = Object.keys(filter[filterName])[0];
      const operatorValue = filter[filterName][comingOperator];
      const supportedOperators = ['eq', 'ne', 'in'];
      logger.debug({
        function: 'handleAppointmentCategoryFilter next 1',
        comingOperator,
        operatorValue,
        condition: !supportedOperators.includes(comingOperator),
      });
      if (!supportedOperators.includes(comingOperator)) {
        throw new BadRequestException(`Not supported filter on appointmentCategory`);
      }
      // check wait list is needed!
      if (
        (comingOperator === 'eq' && operatorValue === waitlist) ||
        (comingOperator === 'ne' && operatorValue === appt) ||
        (comingOperator === 'in' && operatorValue.includes(waitlist))
      ) {
        return {
          name: filterName,
          filter: {
            availabilityId: {
              eq: null,
            },
          },
        };
      }
      // check appointment is needed!
      else if (
        (comingOperator === 'eq' && operatorValue === appt) ||
        (comingOperator === 'ne' && operatorValue === waitlist) ||
        (comingOperator === 'in' && operatorValue.includes(appt))
      ) {
        return {
          name: filterName,
          filter: {
            availabilityId: {
              ne: null,
            },
          },
        };
      }
      // by default returning all.

      return {
        name: filterName,
        filter: {},
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  };

  async getAppointmentByPatientId(identity: IIdentity, patientId: number) {
    const finalStatusId = await this.lookupsService.getFinalStatusIds(identity);
    const options: FindOptions = {
      where: {
        patientId: patientId,
        clinicId: identity.clinicId,
        appointmentStatusId: {
          [Op.notIn]: finalStatusId,
        },
      },
      include: [
        {
          all: true,
        },
      ],
    };
    const appointment = await this.appointmentsRepository.findOne(options);
    if (!appointment) {
      return appointment;
    }
    const actions = await this.lookupsService.findAppointmentsActions([appointment.appointmentStatusId]);
    const appointmentStatusId = await this.lookupsService.getProvisionalAppointmentStatusId(identity);
    return {
      ...appointment.get(),
      previousAppointment: appointment.previousAppointmentId,
      primaryAction: actions[0]?.nextAction ? actions[0].nextAction : null,
      secondaryActions: actions[0]?.secondaryActions ? actions[0].secondaryActions : [],
      provisionalAppointment: appointment.appointmentStatusId === appointmentStatusId,
    };
  }

  async getAppointmentsByPeriods(
    clinicId: number,
    query: QueryAppointmentsByPeriodsDto,
  ): Promise<{ date: string; count: number }[]> {
    const where: any = {
      canceledAt: {
        [Op.eq]: null,
      },
      canceledBy: {
        [Op.eq]: null,
      },
      availabilityId: {
        [Op.ne]: null,
      },
      clinicId,
      startDate: {
        [Op.between]: [query.fromDate, query.toDate],
      },
    };
    if (query.doctorIds && query.doctorIds.length) {
      where.staffId = { [Op.in]: query.doctorIds };
    }

    // Get all appointments
    const result = await this.appointmentsRepository.findAll({
      include: [
        {
          model: AppointmentStatusLookupsModel,
          as: 'status',
          where: {
            code: {
              [Op.notIn]: [
                AppointmentStatusEnum.COMPLETE,
                AppointmentStatusEnum.CANCELED,
                AppointmentStatusEnum.WAIT_LIST,
              ],
            },
          },
        },
      ],
      where,
    });

    const mappedResult: { [key: string]: number } = result
      .map((model) => DateTime.fromJSDate(model.get('startDate')).toISODate())
      .reduce((acc: { [key: string]: number }, startDate: string) => {
        if (acc[startDate]) {
          acc[startDate]++;
        } else {
          acc[startDate] = 1;
        }
        return acc;
      }, {});

    return Object.entries(mappedResult).map(([date, count]) => ({ date, count }));
  }

  async getAllDueProvisionalAppointments(): Promise<AppointmentsModel[]> {
    const yesterday = DateTime.now().minus({ days: 1 }).startOf('day');
    const [startDate, endDate] = getInclusiveSQLDateCondition(yesterday);
    const waitListStatusId = await this.lookupsService.getStatusIdByCode(
      { clinicId: null } as IIdentity,
      AppointmentStatusEnum.WAIT_LIST,
    );
    const sqlQuery = `
        SELECT A.id,
               A.staff_id              AS staffId,
               A.clinic_id             AS clinicId,
               A.patient_id            AS patientId,
               A.start_date            AS startDate,
               A.appointment_status_id AS appointmentStatusId,
               COUNT(*) count
        FROM Appointments A, Appointments B
        WHERE (A.start_date BETWEEN :startDate
          AND :endDate)
          AND A.patient_id = B.patient_id
          AND A.appointment_status_id = :waitListStatusId
        GROUP BY
            id,
            staffId,
            clinicId,
            patientId,
            startDate,
            appointmentStatusId
        HAVING
            count = 1
    `;
    try {
      return this.appointmentsRepository.sequelize.query<AppointmentsModel>(sqlQuery, {
        replacements: {
          startDate,
          endDate,
          waitListStatusId,
        },
        type: QueryTypes.SELECT,
      });
    } catch (error) {
      this.logger.error({
        function: 'getAllDueProvisionalAppointments',
        error,
      });
      throw new InternalServerErrorException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        error,
      });
    }
  }

  getAllUnconfirmedAppointmentInXDays(appointmentThresholdDays: number): Promise<AppointmentsModel[]> {
    const today = DateTime.now();
    const inXDays = DateTime.now().plus({ days: appointmentThresholdDays });
    try {
      return this.appointmentsRepository.findAll({
        include: {
          model: AppointmentStatusLookupsModel,
          where: {
            code: {
              [Op.in]: [AppointmentStatusEnum.SCHEDULE, AppointmentStatusEnum.CONFIRM1, AppointmentStatusEnum.CONFIRM2],
            },
          },
        },
        where: {
          startDate: {
            [Op.between]: getInclusiveSQLDateCondition(today, inXDays),
          },
        },
      });
    } catch (error) {
      this.logger.error({
        function: 'getAllUnconfirmedAppointmentInXDays',
        days: appointmentThresholdDays,
        error,
      });
      throw new InternalServerErrorException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        error,
      });
    }
  }

  getAllYesterdayMissedAppointments(): Promise<AppointmentsModel[]> {
    const yesterday = DateTime.now().minus({ days: 1 }).startOf('day');
    try {
      return this.appointmentsRepository.findAll({
        include: {
          model: AppointmentStatusLookupsModel,
          where: { code: { [Op.in]: [AppointmentStatusEnum.CONFIRM1, AppointmentStatusEnum.CONFIRM2] } },
        },
        where: {
          startDate: {
            [Op.between]: getInclusiveSQLDateCondition(yesterday),
          },
        },
      });
    } catch (error) {
      this.logger.error({
        function: 'getAllYesterdayMissedAppointments',
        error,
      });
      throw new InternalServerErrorException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        error,
      });
    }
  }

  async getLastCompleteAppointment(patientId: number, identity: IIdentity) {
    const appt_completed_statusId = await this.lookupsService.getStatusIdByCode(
      identity,
      AppointmentStatusEnum.COMPLETE,
    );
    return this.appointmentsRepository.findOne({
      where: {
        patientId,
        availabilityId: null,
        appointmentStatusId: appt_completed_statusId, //6
      },
      order: [['id', 'DESC']],
    });
  }

  async updateAppointmentAddRequestData(appointmentId: number, requestData, transaction: Transaction) {
    const { id: appointmentRequestId, date: appointmentRequestDate } = requestData;
    await this.appointmentsRepository.update(
      {
        appointmentRequestId,
        appointmentRequestDate,
      },
      {
        where: {
          id: appointmentId,
        },
        transaction,
      },
    );
  }
}

function mapUpdateDtoToAttributes(
  identity: IIdentity,
  appointment: AppointmentsModel,
  updateDto: UpdateAppointmentDto,
): AppointmentsModelAttributes {
  let startDate = appointment.startDate;
  if (updateDto.startDate) {
    const startDateDto = DateTime.fromISO(updateDto.startDate);
    if (!startDateDto.isValid) {
      throw new BadRequestException({
        code: ErrorCodes.BAD_REQUEST,
        message: 'Bad startDate, it should follow iso',
      });
    }
    startDate = startDateDto.toJSDate();
  }
  const durationMinutes = updateDto.durationMinutes ? updateDto.durationMinutes : appointment.durationMinutes;
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    startDate: startDate,
    endDate: new Date(startDate.getTime() + durationMinutes * MIN_TO_MILLI_SECONDS),
    durationMinutes: durationMinutes,
    staffId: appointment.staffId,
    provisionalDate: appointment.provisionalDate,
    appointmentVisitModeId: updateDto.appointmentVisitModeId,
    complaintsNotes: updateDto.complaintsNotes,
    updatedBy: identity.userId,
    appointmentStatusId: updateDto.appointmentStatusId,
    appointmentTypeId: updateDto.appointmentTypeId,
  };
}

type BatchCancelResult = { appointmentId: number; status: 'OK' | 'FAIL'; error?: string };
