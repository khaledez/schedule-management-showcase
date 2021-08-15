/* eslint-disable @typescript-eslint/ban-ts-comment */
import { FilterDateInputDto, IIdentity, PagingInfoInterface } from '@dashps/monmedx-common';
import { FilterIdsInputDto } from '@dashps/monmedx-common/src/dto/filter-ids-input.dto';
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
} from 'common/constants';
import { AppointmentStatusEnum, AppointmentVisitModeEnum, ErrorCodes, isInTimeGroup, Order } from 'common/enums';
import { map } from 'lodash';
import { DateTime } from 'luxon';
import { GetPatientAppointmentHistoryDto } from 'modules/appointments/dto/get-patient-appointment-history-dto';
import { UpComingAppointmentQueryDto } from 'modules/appointments/dto/upcoming-appointment-query.dto';
import { CreateAvailabilityDto } from 'modules/availability/dto/create.dto';
import { AvailabilityModelAttributes } from 'modules/availability/models/availability.interfaces';
import { AvailabilityModel } from 'modules/availability/models/availability.model';
import { AppointmentStatusLookupsModel } from 'modules/lookups/models/appointment-status.model';
import { PatientInfoModel } from 'modules/patient-info/patient-info.model';
import moment from 'moment';
import { CreateOptions, FindOptions, Op, QueryTypes, Transaction, UpdateOptions, WhereOptions } from 'sequelize';
import { AvailabilityService } from '../availability/availability.service';
import { EventsService } from '../events/events.service';
import { LookupsService } from '../lookups/lookups.service';
import { AppointmentsModel, AppointmentsModelAttributes } from './appointments.model';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateGlobalAppointmentDto } from './dto/global-appointment-create.dto';
import { QueryAppointmentsByPeriodsDto } from './dto/query-appointments-by-periods.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import getInclusiveSQLDateCondition from './utils/get-whole-day-sql-condition';
import { getQueryGenericSortMapper } from './utils/sequelize-sort.mapper';
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
    @Inject(APPOINTMENTS_REPOSITORY)
    private readonly appointmentsRepository: typeof AppointmentsModel,
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: typeof AvailabilityModel,
    private readonly lookupsService: LookupsService,
    @Inject(forwardRef(() => AvailabilityService))
    private readonly availabilityService: AvailabilityService,
    private readonly eventsService: EventsService,
  ) {}

  private readonly associationFieldsFilterNames = {
    patientFullName: `$patient.full_name$`,
    patientHealthPlanNumber: `$patient.primary_health_plan_number$`,
    dob: `$patient.dob$`,
  };

  private readonly associationFieldsSortNames: AssociationFieldsSortCriteria = {
    STATUS: {
      relation: 'status',
      column: 'code',
    },
    DATE: {
      column: AppointmentsService.DATE_COLUMN,
    },
  };

  // TODO refactor this as well
  // eslint-disable-next-line complexity
  async searchWithPatientInfo(
    identity: IIdentity,
    queryParams: QueryParamsDto,
    pagingFilter: PagingInfoInterface,
  ): Promise<[AppointmentsModelAttributes[], number]> {
    const { limit, offset } = pagingFilter || { limit: 15, offset: 0 };

    // custom filter by appointmentCategory
    // const filterByAppointmentCategory = this.handleAppointmentCategoryFilter(queryParams, this.logger);

    // common data-filters
    // const sequelizeFilter = sequelizeFilterMapper(
    //   this.logger,
    //   queryParams,
    //   this.associationFieldsFilterNames,
    //   filterByAppointmentCategory,
    // );
    // const sequelizeSort = sequelizeSortMapper(this.logger, queryParams, this.associationFieldsSortNames, false);

    const startDateWhereClause = this.getStartDateWhereClause(queryParams.filter?.date || {});
    //TODO: Make 'or' field optional in the filter
    const staffIdWhereClause = this.getEntityIdWhereClause(queryParams.filter?.doctorId || { or: null });
    const appointmentTypeIdWhereClause = this.getEntityIdWhereClause(
      queryParams.filter?.appointmentTypeId || { or: null },
    );
    const appointmentStatusIdWhereClause = this.getAppointmentStatusIdWhereClause(
      queryParams.filter?.appointmentStatusId || { or: null },
    );
    const patientInfoInclude = this.buildAppointmentIncludePatientOption(queryParams);
    try {
      const options: FindOptions = {
        include: [
          {
            all: true,
          },
          {
            ...patientInfoInclude,
          },
        ],
        where: {
          appointmentTypeId: appointmentTypeIdWhereClause,
          appointmentStatusId: appointmentStatusIdWhereClause,
          startDate: startDateWhereClause,
          staffId: staffIdWhereClause,
          clinicId: identity.clinicId,
          deletedBy: null,
        },
        order: [[AppointmentsService.DATE_COLUMN, Order.DESC]],
        limit,
        offset,
      };
      const { rows: appointments, count } = await this.appointmentsRepository.findAndCountAll(options);

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

  buildAppointmentIncludePatientOption(queryParams: QueryParamsDto) {
    let where: WhereOptions<PatientInfoModel> = {};

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

  getAppointmentStatusIdWhereClause(entity: FilterIdsInputDto) {
    if (entity && entity.in) {
      return { [Op.in]: entity.in };
    } else if (entity && entity.eq) {
      return { [Op.eq]: entity.eq };
    }
    // TODO This is as bad as it can gets, refactor
    return { [Op.notIn]: [6, 7] };
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
    // This flow is seperated in a function because most of it
    // requires a database transaction
    // eslint-disable-next-line complexity
    const validateInputThenArrangeAttributesAndCommit = async (transaction: Transaction) => {
      // TODO: refactor the entire create appointment flow
      if (dto.availabilityId) {
        return this.createAppointmentWithAvailability(identity, dto, transaction);
      }
      // 1.2 Appointment, Status, Visit Mode
      await this.validateLookupIds(identity, dto, transaction);
      // 1.3 Is provisional and patient has provisional
      const [isProvisional, provisionalAppointment] = await Promise.all([
        this.isProvisional(identity, dto),
        this.getPatientProvisionalAppointment(identity, dto.patientId),
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

      if (!isProvisional && !provisionalAppointment) {
        const errorMessage =
          'Cannot create non-provisional appointment, patient has no previous provisional appointment';
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

      /* 2. Arrange attributes */
      const {
        availabilityId,
        startDate,
        endDate,
        durationMinutes,
        appointmentTypeId,
        appointmentStatusId,
        appointmentVisitModeId,
      } = await Promise.all([
        this.getAvailabilityOrCreateOne(identity, { ...dto }, transaction),
        this.getAppointmentVisitModeId(dto),
        this.getAppointmentStatusId(identity, dto),
      ]).then(([availabilityInfo, appointmentVisitModeId, appointmentStatusId]) => ({
        availabilityId: availabilityInfo.availabilityId,
        startDate: availabilityInfo.startDate,
        endDate: availabilityInfo.endDate,
        durationMinutes: availabilityInfo.durationMinutes,
        appointmentTypeId: availabilityInfo.appointmentTypeId,
        appointmentVisitModeId,
        appointmentStatusId,
      }));
      const provisionalDate: Date = isProvisional ? startDate : provisionalAppointment.startDate;
      /* 3. Act/Execution */
      await this.cancelAllAppointments(identity, dto.patientId, transaction);
      const createdAppointment = await this.appointmentsRepository.create(
        {
          ...dto,
          appointmentTypeId,
          clinicId: identity.clinicId,
          createdBy: identity.userId,
          provisionalDate,
          startDate,
          endDate,
          durationMinutes,
          appointmentVisitModeId,
          appointmentStatusId,
          availabilityId,
          upcomingAppointment,
        },
        { transaction },
      );
      return createdAppointment;
    };

    if (!transaction) {
      return this.appointmentsRepository.sequelize.transaction(validateInputThenArrangeAttributesAndCommit);
    }
    return validateInputThenArrangeAttributesAndCommit(transaction);
  }

  // eslint-disable-next-line complexity
  async createAppointmentWithAvailability(
    identity: IIdentity,
    dto: CreateAppointmentDto,
    transaction?: Transaction,
  ): Promise<AppointmentsModel> {
    if (!dto.availabilityId) {
      const errorMessage = 'You must provide availabilityId';
      this.logger.error({
        function: 'service/appointment/createAppointmentWithAvailability',
        message: errorMessage,
      });
      throw new BadRequestException({
        fields: ['availabilityId'],
        code: ErrorCodes.BAD_REQUEST,
        message: errorMessage,
      });
    }
    const availabilityModel = await this.availabilityService.findOne(dto.availabilityId);
    if (!availabilityModel) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: `Availability of id ${dto.availabilityId} not found`,
      });
    }
    if (availabilityModel.isOccupied) {
      throw new BadRequestException({
        code: ErrorCodes.BAD_REQUEST,
        message: `Availability of id ${dto.availabilityId} is already used`,
      });
    }
    if (dto.appointmentTypeId) {
      await this.lookupsService.validateAppointmentsTypes(identity, [dto.appointmentTypeId], transaction);
    }
    let endDate = null;
    if (dto.startDate && dto.durationMinutes) {
      const dtoEndDate = new Date(dto.startDate).getTime();
      endDate = new Date(dtoEndDate + dto.durationMinutes * MIN_TO_MILLI_SECONDS);
    }
    const upcomingAppointment = await this.getPatientUpcomingAppointment(identity, dto.patientId);

    try {
      await this.cancelAllAppointments(identity, dto.patientId, transaction);
      const createdAppointment = await this.appointmentsRepository.create(
        {
          patientId: dto.patientId,
          clinicId: identity.clinicId,
          createdBy: identity.userId,
          staffId: dto.staffId || availabilityModel.staffId,
          availabilityId: dto.availabilityId,
          startDate: new Date(dto.startDate) || availabilityModel.startDate,
          endDate: endDate || availabilityModel.endDate,
          durationMinutes: endDate ? dto.durationMinutes : availabilityModel.durationMinutes,
          appointmentTypeId: dto.appointmentTypeId || availabilityModel.appointmentTypeId,
          appointmentStatusId:
            dto.appointmentStatusId || (await this.lookupsService.getScheduleAppointmentStatusId(identity)),
          appointmentVisitModeId: dto.appointmentVisitModeId,
          upcomingAppointment: true,
          provisionalDate: upcomingAppointment?.startDate || availabilityModel.startDate,
          previousAppointmentId: upcomingAppointment?.id,
          complaintsNotes: dto.complaintsNotes,
        },
        { transaction },
      );
      availabilityModel.isOccupied = true;
      await availabilityModel.save({ transaction });
      return createdAppointment;
    } catch (error) {
      throw new InternalServerErrorException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  async cancelAllAppointments(identity, patientId, transaction) {
    const [statusCanceledId, statusCompleteId, scheduleReasonId] = await Promise.all([
      this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.CANCELED),
      this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.COMPLETE),
      this.lookupsService.getCancelRescheduleReasonByCode('RELEASE'), // TODO add a RESCHEDULE code in the lookup table
    ]);

    const patientAppointments = await this.appointmentsRepository.findAll({
      where: {
        patientId: {
          [Op.eq]: patientId,
        },
        clinicId: {
          [Op.eq]: identity.clinicId,
        },
        appointmentStatusId: {
          [Op.notIn]: [statusCanceledId, statusCompleteId],
        },
        deletedBy: null,
      },
      transaction,
    });

    const appointmentsToCancel = patientAppointments.map(
      (appointment): CancelAppointmentDto => ({
        appointmentId: appointment.id,
        keepAvailabiltySlot: true,
        reasonText: 'Scheduled a new appointment',
        reasonId: scheduleReasonId,
      }),
    );
    await this.cancelAppointments(identity, appointmentsToCancel, transaction);
  }

  async createAppointmentAfterVisitFlow(identity: IIdentity, dto: CreateAppointmentDto, transaction?: Transaction) {
    const {
      availabilityId,
      startDate,
      endDate,
      durationMinutes,
      appointmentTypeId,
      appointmentStatusId,
      appointmentVisitModeId,
    } = await Promise.all([
      this.getAvailabilityOrCreateOne(identity, { ...dto }, transaction),
      this.getAppointmentVisitModeId(dto),
      this.getAppointmentStatusId(identity, dto),
    ]).then(([availabilityInfo, appointmentVisitModeId, appointmentStatusId]) => ({
      availabilityId: availabilityInfo.availabilityId,
      startDate: availabilityInfo.startDate,
      endDate: availabilityInfo.endDate,
      durationMinutes: availabilityInfo.durationMinutes,
      appointmentTypeId: availabilityInfo.appointmentTypeId,
      appointmentVisitModeId,
      appointmentStatusId,
    }));
    await this.cancelAllAppointments(identity, dto.patientId, transaction);
    const createdAppointment = await this.appointmentsRepository.create(
      {
        ...dto,
        appointmentTypeId,
        clinicId: identity.clinicId,
        createdBy: identity.userId,
        provisionalDate: startDate,
        startDate,
        endDate,
        durationMinutes,
        appointmentVisitModeId,
        appointmentStatusId,
        availabilityId,
        upcomingAppointment: true,
      },
      { transaction },
    );
    return createdAppointment;
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
   * @param id Availability Id
   * @param identity Used to create an availability if needed
   * @param transaction ^^
   */
  private async getAvailabilityOrCreateOne(
    identity: IIdentity,
    data: AvailabilityBasicInfo,
    transaction: Transaction,
  ): Promise<{
    availabilityId: number | null;
    startDate: Date;
    endDate: Date;
    durationMinutes: number;
    appointmentTypeId: number;
  }> {
    let availability: AvailabilityModelAttributes;
    if (data.availabilityId) {
      // Get availbility id data if provided
      availability = await this.availabilityService.findOne(data.availabilityId);
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
    const startDate = availability.startDate;
    const endDate = availability.endDate;
    const durationMinutes = availability.durationMinutes;
    const appointmentTypeId = availability.appointmentTypeId;
    return { availabilityId: availability.id, startDate, endDate, durationMinutes, appointmentTypeId };
  }

  /**
   * Validates in parallel appointment type, visitmodes, statuses
   * @param identity
   * @param dto
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
   * @param dto
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

  async findOne(id: number): Promise<AppointmentsModelAttributes> {
    const appointment = await this.appointmentsRepository.unscoped().findByPk(id, {
      include: [
        {
          all: true,
        },
      ],
    });
    if (!appointment) {
      throw new NotFoundException({
        fields: [],
        code: ErrorCodes.NOT_FOUND,
        message: 'This appointment does not exits!',
      });
    }
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
      provisionalAppointment: !appointment.availabilityId,
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

  /**
   * Get patient next provisional appointment
   * @param patientId
   */
  async getPatientProvisionalAppointment(
    identity: IIdentity,
    patientId: number,
    transaction?: Transaction,
  ): Promise<AppointmentsModel> {
    const waitListStatusId = await this.lookupsService.getProvisionalAppointmentStatusId(identity);
    const options: FindOptions = {
      where: {
        patientId,
        appointmentStatusId: waitListStatusId,
      },
      transaction,
    };
    return this.appointmentsRepository.findOne(options);
  }

  async createAnAppointmentWithFullResponse(
    dto: CreateGlobalAppointmentDto,
    transaction?: Transaction,
  ): Promise<AppointmentsModel> {
    this.logger.debug({
      function: 'appointmentToCreate',
      dto,
    });

    let appointmentStatusId = dto.appointmentStatusId;
    if (!appointmentStatusId) {
      appointmentStatusId = await this.lookupsService.getProvisionalAppointmentStatusId({
        clinicId: dto.clinicId,
      } as IIdentity);
    }

    const inputAttr = mapCreateGlobalDtoToAttributes(dto, appointmentStatusId);
    this.logger.debug({
      title: 'appointment create payload',
      payload: inputAttr,
    });

    if (dto.availabilityId) {
      await this.validateAvailabilityId(dto.availabilityId);
    }

    //change other appointments upcoming_appointment field to 0
    await this.appointmentsRepository.update(
      { upcomingAppointment: false },
      { where: { patientId: dto.patientId }, transaction },
    );

    const options: CreateOptions = {};
    if (transaction) {
      options.transaction = transaction;
    }

    const result: AppointmentsModel = await this.appointmentsRepository.create(inputAttr, options);

    // attach this appointment the event
    if (dto.availabilityId) {
      await this.eventsService.addAppointmentToEventByAvailability(
        dto.createdBy,
        dto.availabilityId,
        result.id,
        transaction,
      );
    } else {
      // here create new calender event without availability
      await this.eventsService.create(
        // @ts-ignore
        { userId: dto.createdBy, clinicId: dto.clinicId },
        { staffId: dto.createdBy, ...dto, startDate: dto.date, appointmentId: result.id },
        transaction,
      );
    }

    this.logger.debug({
      function: 'createAnAppointmentWithFullResponse',
      result,
    });
    return result;
  }

  rescheduleAppointment(identity: IIdentity, dto: RescheduleAppointmentDto): Promise<AppointmentsModelAttributes> {
    return this.appointmentsRepository.sequelize.transaction(
      // eslint-disable-next-line complexity
      async (transaction): Promise<AppointmentsModelAttributes> => {
        // 0. validate
        await this.lookupsService.validateAppointmentCancelRescheduleReason(identity, [dto.rescheduleReason]);

        // 1. fetch appointment
        const appointment = await this.appointmentsRepository.findOne({
          transaction,
          where: { id: dto.appointmentId, clinicId: identity.clinicId },
          include: { model: AvailabilityModel, required: true },
        });
        if (!appointment) {
          throw new NotFoundException({
            fields: ['appointmentId'],
            message: `Appointment with id = ${dto.appointmentId} not found`,
            error: 'NOT_FOUND',
          });
        }

        // 2. check if we need to change the doctor permanently
        if ((appointment.staffId !== dto.staffId && dto.staffChangedPermanent) || dto.removeFutureAppointments) {
          // cancel all future appointments with the current doctor
          const reasonLookup = await this.lookupsService.getCancelRescheduleReasonById(dto.rescheduleReason);
          await this.cancelPatientInCompleteAppointments(
            identity,
            appointment.patientId,
            reasonLookup.code,
            transaction,
          );
        }

        // 3. availability slot
        const startDate = dto.startDate ? DateTime.fromISO(dto.startDate) : DateTime.fromJSDate(appointment.startDate);
        const durationMinutes = dto.durationMinutes ? dto.durationMinutes : appointment.durationMinutes;
        if (dto.keepAvailabilitySlot) {
          // create a new availability in the same time for the same staff
          const newAvailabilityAttrs: CreateAvailabilityDto = {
            appointmentTypeId: appointment.appointmentTypeId,
            isOccupied: false,
            startDate: startDate.toISO(),
            durationMinutes: durationMinutes,
            staffId: appointment.staffId,
          };

          this.availabilityService.createSingleAvailability(identity, newAvailabilityAttrs, transaction);
        }

        // 4. cancel appointment and create a new appointment
        const scheduleStatusId = await this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.SCHEDULE);
        const [cancelResult, createResult] = await Promise.all([
          this.cancelAppointments(
            identity,
            [
              {
                appointmentId: appointment.id,
                keepAvailabiltySlot: false, // we delete the availability as we've already handled this case above
                reasonId: dto.rescheduleReason,
                reasonText: dto.rescheduleText,
              },
            ],
            transaction,
          ),

          // this will create an availability in the same time
          this.createAppointment(
            identity,
            {
              patientId: appointment.patientId,
              staffId: dto.staffId || appointment.staffId,
              appointmentStatusId: scheduleStatusId,
              appointmentVisitModeId: appointment.appointmentVisitModeId,
              appointmentTypeId: appointment.appointmentTypeId,
              durationMinutes,
              startDate: startDate.toISO(),
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

  /**
   * cancel all patient InComplete appointments including provisional
   * @param patientId
   * @param transaction
   */
  cancelPatientInCompleteAppointments(
    identity: IIdentity,
    patientId: number,
    cancelReason: string,
    transaction?: Transaction,
  ) {
    const cancelActionWithTransaction = async (transaction: Transaction) => {
      const [canceledStatusId, completeStatusId, cancelReasonId] = await Promise.all([
        this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.CANCELED),
        this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.COMPLETE),
        this.lookupsService.getCancelRescheduleReasonByCode(cancelReason, transaction),
      ]);
      this.logger.debug({
        function: 'cancelPatientInCompleteAppointments',
        canceledStatusId,
        completeStatusId,
      });

      if (!cancelReasonId) {
        throw new BadRequestException({
          message: `Unknown cancel code: ${cancelReason}`,
          fields: ['cancel_reschedule_reason_id'],
        });
      }

      return this.appointmentsRepository.unscoped().update(
        {
          appointmentStatusId: canceledStatusId,
          cancelRescheduleReasonId: cancelReasonId,
        },
        {
          where: {
            clinicId: identity.clinicId,
            patientId,
            appointmentStatusId: {
              [Op.ne]: completeStatusId,
            },
            canceledAt: new Date(),
            canceledBy: identity.userId,
          },
          transaction,
        },
      );
    };

    if (!transaction) {
      return this.appointmentsRepository.sequelize.transaction(cancelActionWithTransaction);
    }
    return cancelActionWithTransaction(transaction);
  }

  /**
   * Only cancels the given appointment, it doesn't create any new provisional appointments,
   * make sure to handle it separately
   * @param identity
   * @param cancelDto provisionalDate attribute is ignored
   * @param transaction
   * @returns
   */
  cancelAppointments(
    identity: IIdentity,
    cancelDto: CancelAppointmentDto[],
    transaction?: Transaction,
  ): Promise<BatchCancelResult[]> {
    const procedureInTx = async (transaction) => {
      // 1. validate input
      await this.lookupsService.validateAppointmentCancelRescheduleReason(
        identity,
        cancelDto.map((d) => d.reasonId),
        transaction,
      );

      const appointments = await this.appointmentsRepository.unscoped().findAll({
        where: { id: { [Op.in]: cancelDto.map((d) => d.appointmentId) }, clinicId: identity.clinicId },
        include: AvailabilityModel,
        transaction,
      });

      // match returned appointments with dtos and create result tuple
      const actionTuples = cancelDto.map((dto): {
        cancelReq: CancelAppointmentDto;
        appointment: AppointmentsModel;
        result: BatchCancelResult;
      } => {
        const apptsMatching = appointments.filter((a) => a.id === dto.appointmentId);
        const appointment = apptsMatching ? apptsMatching[0] : null;

        const result: BatchCancelResult = appointment
          ? { appointmentId: dto.appointmentId, status: 'OK' }
          : {
              appointmentId: dto.appointmentId,
              status: 'FAIL',
              error: `Appointment with id = ${dto.appointmentId} not found`,
            };

        return { cancelReq: dto, appointment, result };
      });

      // 2. release availability if asked
      const availabilitiesToUpdate = actionTuples
        .filter((t) => t.appointment?.availability)
        .map(({ cancelReq, appointment }) => {
          if (cancelReq.keepAvailabiltySlot && appointment.availability) {
            appointment.availability.updatedAt = new Date();
            appointment.availability.updatedBy = identity.userId;
            appointment.availability.isOccupied = false;
            return appointment.availability.get({ plain: true });
          } else if (appointment.availability) {
            appointment.availability.deletedAt = new Date();
            appointment.availability.deletedBy = identity.userId;
            return appointment.availability.get({ plain: true });
          }
          return null;
        })
        .filter((av) => av !== null);

      if (availabilitiesToUpdate) {
        await this.availabilityRepository.bulkCreate(availabilitiesToUpdate, {
          transaction,
          updateOnDuplicate: ['updatedAt', 'updatedBy', 'isOccupied', 'deletedAt', 'deletedBy'],
          validate: true,
        });
      }

      // 3. cancel appointments
      const statusCanceledId = await this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.CANCELED);
      const appointmentsToUpdate = actionTuples
        .filter((t) => t.appointment)
        .map(({ cancelReq, appointment }) => {
          appointment.appointmentStatusId = statusCanceledId;
          appointment.cancelRescheduleReasonId = cancelReq.reasonId;
          appointment.cancelRescheduleText = cancelReq.reasonText;
          appointment.upcomingAppointment = false;
          appointment.updatedAt = new Date();
          appointment.updatedBy = identity.userId;
          appointment.canceledAt = new Date();
          appointment.canceledBy = identity.userId;
          return appointment.get({ plain: true });
        });
      if (appointmentsToUpdate) {
        await this.appointmentsRepository.bulkCreate(appointmentsToUpdate, {
          transaction,
          updateOnDuplicate: [
            'appointmentStatusId',
            'cancelRescheduleReasonId',
            'cancelRescheduleText',
            'upcomingAppointment',
            'updatedAt',
            'updatedBy',
            'canceledAt',
            'canceledBy',
          ],
        });
      }

      return actionTuples.map(({ result }) => result);
    };

    if (transaction) {
      return procedureInTx(transaction);
    }
    return this.appointmentsRepository.sequelize.transaction(procedureInTx);
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
            error: 'NOT_FOUND',
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
          this.logger.error({ method: 'appointmentService/updateAppointment', updateDto, message: error.message });
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

  // TODO: delete this after ability to change status
  async patchAppointment(id: number, data: any, transaction?: Transaction): Promise<AppointmentsModelAttributes> {
    const options: UpdateOptions = {
      where: {
        id,
      },
    };
    if (transaction) {
      options.transaction = transaction;
    }
    await this.appointmentsRepository.scope('id').update(data, options);
    return this.findOne(id);
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

  getAppointmentByPatientId(
    identity: IIdentity,
    patientId: number,
    query: UpComingAppointmentQueryDto,
  ): Promise<AppointmentsModelAttributes> {
    if (query?.after) {
      return this.getPatientNextAppointment(identity, patientId, query.after);
    }
    return this.getPatientUpcomingAppointment(identity, patientId);
  }

  getPatientUpcomingAppointment(identity: IIdentity, id: number) {
    const options: FindOptions = {
      where: {
        patientId: id,
        clinicId: identity.clinicId,
        upcomingAppointment: true,
      },
    };
    return this.appointmentsRepository.findOne(options);
  }

  getPatientNextAppointment(identity: IIdentity, patientId: number, appointmentId: number) {
    const options: FindOptions = {
      where: {
        patientId: patientId,
        clinicId: identity.clinicId,
        id: {
          [Op.gt]: appointmentId,
        },
      },
    };
    return this.appointmentsRepository.findOne(options);
  }

  async getAppointmentsByPeriods(clinicId: number, query: QueryAppointmentsByPeriodsDto): Promise<any> {
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
      where.doctorId = { [Op.in]: query.doctorIds };
    }
    const result = await this.appointmentsRepository.scope('active').count({
      attributes: ['start_date'],
      group: ['start_date'],
      include: [
        {
          model: AppointmentStatusLookupsModel,
          as: 'status',
          where: {
            code: {
              [Op.in]: ['SCHEDULE', 'CONFIRM', 'CHECK_IN', 'READY'],
            },
          },
        },
        {
          model: PatientInfoModel,
          as: 'patient',
        },
      ],
      where,
    });

    return map(result, ({ count, date }: { count: number; date: string }) => ({
      count,
      date: moment(date).format('YYYY-MM-DD'),
    }));
  }

  private async validateAvailabilityId(id: number): Promise<void> {
    const doesAvailabilityExists = await this.availabilityService.doesExist(id);
    if (!doesAvailabilityExists) {
      throw new NotFoundException({
        fields: ['availability_id'],
        code: 'NOT_FOUND',
        message: 'The availability does not exits!',
      });
    }
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
}

function mapUpdateDtoToAttributes(
  identity: IIdentity,
  appointment: AppointmentsModel,
  updateDto: UpdateAppointmentDto,
): AppointmentsModelAttributes {
  const startDate = updateDto.startDate ? DateTime.fromISO(updateDto.startDate).toJSDate() : appointment.startDate;
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

function mapCreateGlobalDtoToAttributes(
  dto: CreateGlobalAppointmentDto,
  appointmentStatusId: number,
): AppointmentsModelAttributes {
  const startDate = DateTime.fromJSDate(dto.date);
  const durationMins = dto.durationMinutes || DEFAULT_EVENT_DURATION_MINS;

  return {
    ...dto,
    startDate: startDate.toJSDate(),
    appointmentStatusId,
    durationMinutes: durationMins,
    endDate: startDate.plus({ minutes: durationMins }).toJSDate(),
    provisionalDate: dto.provisionalDate ? dto.provisionalDate : startDate.toJSDate(),
    staffId: dto.doctorId,
    availabilityId: dto.availabilityId,
    upcomingAppointment: true,
  };
}

type BatchCancelResult = { appointmentId: number; status: 'OK' | 'FAIL'; error?: string };
