/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IIdentity, PagingInfoInterface } from '@dashps/monmedx-common';
import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  APPOINTMENTS_REPOSITORY,
  APPOINTMENT_CHECKIN_STATUS_EVENT,
  BAD_REQUEST,
  DEFAULT_EVENT_DURATION_MINS,
  SCHEDULE_MGMT_TOPIC,
} from 'common/constants';
import { AppointmentVisitModeEnum, ErrorCodes } from 'common/enums';
import { AppointmentStatusEnum } from 'common/enums/appointment-status.enum';
import { UserError } from 'common/interfaces/user-error.interface';
import { map } from 'lodash';
import { DateTime } from 'luxon';
import { CreateAvailabilityDto } from 'modules/availability/dto/create.dto';
import { AvailabilityModelAttributes } from 'modules/availability/models/availability.interfaces';
import { PatientInfoModel } from 'modules/patient-info/patient-info.model';
import * as moment from 'moment';
import { CreateOptions, FindOptions, Op, Transaction, UpdateOptions } from 'sequelize';
import { AvailabilityService } from '../availability/availability.service';
import { EventsService } from '../events/events.service';
import { LookupsService } from '../lookups/lookups.service';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';
import { AppointmentsModel, AppointmentsModelAttributes } from './appointments.model';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateGlobalAppointmentDto } from './dto/global-appointment-create.dto';
import { QueryAppointmentsByPeriodsDto } from './dto/query-appointments-by-periods.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { UpComingAppointmentQueryDto } from './dto/upcoming-appointment-query.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { sequelizeFilterMapper } from './utils/sequelize-filter.mapper';
import { sequelizeSortMapper } from './utils/sequelize-sort.mapper';
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

  constructor(
    @Inject(APPOINTMENTS_REPOSITORY)
    private readonly appointmentsRepository: typeof AppointmentsModel,
    private readonly lookupsService: LookupsService,
    @Inject(forwardRef(() => AvailabilityService))
    private readonly availabilityService: AvailabilityService,
    private readonly eventsService: EventsService,
  ) {}

  private readonly associationFieldsFilterNames = {
    patientFullName: `$patient.full_name$`,
    patientHealthPlanNumber: `$patient.primary_health_plan_number$`,
    time: `$availability.start_time$`,
    dob: `$patient.dob$`,
  };

  private readonly associationFieldsSortNames: AssociationFieldsSortCriteria = {
    STATUS: {
      relation: 'status',
      column: 'code',
    },
    DATE: {
      column: 'start_date',
    },
  };

  async searchWithPatientInfo(
    identity: IIdentity,
    queryParams: QueryParamsDto,
    pagingFilter: PagingInfoInterface,
  ): Promise<[AppointmentsModelAttributes[], number]> {
    const { limit, offset } = pagingFilter || { limit: 15, offset: 0 };

    // custom filter by appointmentCategory
    const filterByAppointmentCategory = this.handleAppointmentCategoryFilter(queryParams, this.logger);

    // common data-filters
    const sequelizeFilter = sequelizeFilterMapper(
      this.logger,
      queryParams,
      this.associationFieldsFilterNames,
      filterByAppointmentCategory,
    );
    const sequelizeSort = sequelizeSortMapper(this.logger, queryParams, this.associationFieldsSortNames, false);
    try {
      const options: FindOptions = {
        // benchmark: true,
        // logging: true,
        include: [
          {
            all: true,
          },
        ],
        where: {
          upcomingAppointment: true,
          ...sequelizeFilter,
          clinicId: identity.clinicId,
        },
        order: sequelizeSort,
        limit,
        offset,
      };

      const { rows: appointments, count } = await this.appointmentsRepository.scope('active').findAndCountAll(options);

      const appointmentsStatusIds: number[] = [];
      const appointmentsAsPlain = appointments.map((e) => {
        appointmentsStatusIds.push(e.status.id);
        return e.get({ plain: true });
      });

      const actions = await this.lookupsService.findAppointmentsActions(appointmentsStatusIds);

      const searchResult = appointmentsAsPlain.map((appt: AppointmentsModel, i) => ({
        ...appt,
        previousAppointment: appt.previousAppointmentId,
        primaryAction: actions[i]?.nextAction ? actions[i].nextAction : [],
        secondaryActions: actions[i]?.secondaryActions ? actions[i].secondaryActions : [],
        provisionalAppointment: !appt.availabilityId,
      }));

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

  /**
   * Handles provisional or non-provisional appointment corresponding to patient
   * references to an availability slot (created if non-existent)
   * @param dto
   * @param identity
   * @param transaction Passed incase we need to create an availability
   * @returns
   */
  createAppointment(
    identity: IIdentity,
    dto: CreateAppointmentDto,
    transaction?: Transaction,
  ): Promise<{ appointment?: AppointmentsModel; errors?: UserError[] }> {
    /* 1. Validation */
    // 1.1 Appointment type id
    if (!(dto.availabilityId || (dto.appointmentTypeId && dto.startDate && dto.durationMinutes))) {
      const errorMessage =
        "You didn't provide availbilityId you must provide: startDate, durationMinutes and appointmentTypeId";
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

    // This flow is seperated in a function because most of it
    // requires a database transaction
    const validateInputThenArrangeAttributesAndCommit = async (transaction: Transaction) => {
      // 1.2 Appointment, Status, Visit Mode
      await this.validateLookupIds(identity, dto, transaction);
      // 1.3 Is provisional and patient has provisional
      const [isProvisional, provisionalAppointment] = await Promise.all([
        this.isProvisional(dto),
        this.getPatientProvisionalAppointment(dto.patientId),
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
        this.getAvailbilityOrCreateOne(identity, { ...dto }, isProvisional, transaction),
        this.getAppointmentVisitModeId(dto),
        this.getAppointmentStatusId(dto),
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
        },
        { transaction },
      );
      return {
        appointment: createdAppointment,
      };
    };

    if (!transaction) {
      return this.appointmentsRepository.sequelize.transaction(validateInputThenArrangeAttributesAndCommit);
    }
    return validateInputThenArrangeAttributesAndCommit(transaction);
  }

  /**
   * Checks if to-be created appointment is provisional
   * @returns True if status id corresponds to WAIT_LIST
   * @returns True if status id is not provided (DEFAULTS)
   */
  private async isProvisional(dto: CreateAppointmentDto) {
    if (!dto.appointmentStatusId) {
      return true;
    }
    const waitStatusId = await this.lookupsService.getStatusIdByCode(AppointmentStatusEnum.WAIT_LIST);
    return waitStatusId === dto.appointmentStatusId;
  }

  /**
   * Returns availability attributes. creates one and returns if non existent
   * @param id Availability Id
   * @param identity Used to create an availability if needed
   * @param transaction ^^
   */
  private async getAvailbilityOrCreateOne(
    identity: IIdentity,
    data: AvailabilityBasicInfo,
    isProvisional: boolean,
    transaction: Transaction,
  ): Promise<{
    availabilityId: number | null;
    startDate: Date;
    endDate: Date;
    durationMinutes: number;
    appointmentTypeId: number;
  }> {
    // if we have a provisional date then availaiblity ID is not required
    if (isProvisional && !data.availabilityId) {
      return {
        availabilityId: null,
        startDate: DateTime.fromISO(data.startDate).toJSDate(),
        endDate: DateTime.fromISO(data.startDate).plus({ minutes: data.durationMinutes }).toJSDate(),
        durationMinutes: data.durationMinutes,
        appointmentTypeId: data.appointmentTypeId,
      };
    }

    let availability: AvailabilityModelAttributes;
    if (data.availabilityId) {
      // Get availbility id data if provided
      availability = await this.availabilityService.findOne(data.availabilityId);
    } else {
      // Create availability on spot
      // startDate & durationMinutes are required if exists no availabilityId
      const availabilityAttributes: CreateAvailabilityDto = {
        appointmentTypeId: data.appointmentTypeId,
        staffId: data.staffId,
        durationMinutes: data.durationMinutes,
        startDate: data.startDate,
      };
      // Act
      availability = (await this.availabilityService.bulkCreate([availabilityAttributes], identity, transaction))[0];
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
  private getAppointmentStatusId(dto: CreateAppointmentDto): Promise<number> {
    const id = dto.appointmentStatusId;
    if (id) {
      return Promise.resolve(id);
    }
    return this.lookupsService.getStatusIdByCode(AppointmentStatusEnum.WAIT_LIST);
  }

  async findOne(id: number): Promise<any> {
    const appointment = await this.appointmentsRepository.scope('getOne').findByPk(id, {
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

  async patientHasProvisionalAppointment(patientId: number): Promise<boolean> {
    const provitionals = await this.getPatientProvisionalAppointment(patientId);
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
  async getPatientProvisionalAppointment(patientId: number, transaction?: Transaction): Promise<AppointmentsModel> {
    const waitListStatusId = await this.lookupsService.getStatusIdByCode(AppointmentStatusEnum.WAIT_LIST);
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
      appointmentStatusId = await this.lookupsService.getStatusIdByCode(AppointmentStatusEnum.WAIT_LIST);
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

  async completeAppointment(appointmentId: number, identity, transaction: Transaction) {
    const completeStatusId = await this.lookupsService.getStatusIdByCode(AppointmentStatusEnum.COMPLETE);
    this.logger.debug({
      function: 'completeAppointment',
      completeStatusId,
    });
    return this.appointmentsRepository.unscoped().update(
      {
        appointmentStatusId: completeStatusId,
        updatedBy: identity.userId,
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
   * cancel all patient future appointments including provisional after given appointment id
   * @param patientId
   * @param transaction
   */
  async cancelPatientAppointments(patientId: number, cancelReason, transaction: Transaction) {
    const [canceledStatusId, completeStatusId] = await Promise.all([
      this.lookupsService.getStatusIdByCode(AppointmentStatusEnum.CANCELED),
      this.lookupsService.getStatusIdByCode(AppointmentStatusEnum.COMPLETE),
    ]);
    this.logger.debug({
      function: 'cancelPatientAppointments',
      canceledStatusId,
      completeStatusId,
    });

    return this.appointmentsRepository.unscoped().update(
      {
        appointmentStatusId: canceledStatusId,
        ...cancelReason,
      },
      {
        where: {
          patientId,
          appointmentStatusId: {
            [Op.ne]: completeStatusId,
          },
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

        // 3. update database
        const attributes = mapUpdateDtoToAttributes(identity, appointment, updateDto);

        this.logger.debug({ method: 'appointmentService/updateAppointment', updateDto, attributes });
        const result = await this.appointmentsRepository.update(attributes, {
          where: {
            id: appointmentId,
          },
          transaction,
        });

        this.logger.debug({ method: 'appointmentService/updateAppointment', result });

        const updatedAppt = await this.appointmentsRepository.findByPk(appointmentId, { transaction });

        // 4. publish event if status changed to check in
        this.publishEventIfStatusMatches(
          AppointmentStatusEnum.CHECK_IN,
          updatedAppt,
          updateDto,
          APPOINTMENT_CHECKIN_STATUS_EVENT,
        );

        return updatedAppt;
      },
    );
  }

  async publishEventIfStatusMatches(
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
      const targetStatusId = await this.lookupsService.getStatusIdByCode(targetStatus);
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
  async patchAppointment(id: number, data: any, transaction?: Transaction): Promise<AppointmentsModel> {
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

  findAppointmentByPatientId(id: number, queryData: UpComingAppointmentQueryDto): Promise<AppointmentsModelAttributes> {
    const query: any = {
      filter: {
        patientId: {
          eq: id,
        },
      },
    };
    this.logger.debug({
      title: 'upcoming appointment query',
      queryData,
    });
    if (queryData.after) {
      query.filter.date = {
        gt: new Date(),
      };
      query.filter.upcomingAppointment = {
        in: [true, false],
      };
    }

    return this.appointmentsRepository.findOne(query);
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
      date: {
        [Op.between]: [query.fromDate, query.toDate],
      },
    };
    if (query.doctorIds && query.doctorIds.length) {
      where.doctorId = { [Op.in]: query.doctorIds };
    }
    const result = await this.appointmentsRepository.scope('active').count({
      attributes: ['date'],
      group: ['date'],
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
}

function mapUpdateDtoToAttributes(
  identity: IIdentity,
  appointment: AppointmentsModel,
  updateDto: UpdateAppointmentDto,
): AppointmentsModelAttributes {
  const startDate = DateTime.fromISO(updateDto.startDate);
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    startDate: startDate.toJSDate(),
    endDate: startDate.plus({ minutes: updateDto.durationMinutes }).toJSDate(),
    durationMinutes: updateDto.durationMinutes,
    staffId: appointment.staffId,
    provisionalDate: appointment.provisionalDate,
    appointmentVisitModeId: updateDto.appointmentVisitModeId,
    complaintsNotes: updateDto.complaintsNotes,
    updatedBy: identity.userId,
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
  };
}
