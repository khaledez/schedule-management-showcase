/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IIdentity, PagingInfoInterface } from '@dashps/monmedx-common';
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  APPOINTMENTS_REPOSITORY,
  APPOINTMENT_CHECKIN_STATUS_EVENT,
  DEFAULT_EVENT_DURATION_MINS,
  SCHEDULE_MGMT_TOPIC,
} from 'common/constants';
import { ErrorCodes } from 'common/enums';
import { AppointmentStatusEnum } from 'common/enums/appointment-status.enum';
import { map } from 'lodash';
import { DateTime } from 'luxon';
import { PatientInfoModel } from 'modules/patient-info/patient-info.model';
import * as moment from 'moment';
import { CreateOptions, FindOptions, Op, Transaction, UpdateOptions } from 'sequelize';
import { AvailabilityService } from '../availability/availability.service';
import { EventsService } from '../events/events.service';
import { LookupsService } from '../lookups/lookups.service';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';
import { AppointmentsModel, AppointmentsModelAttributes } from './appointments.model';
import { CreateNonProvisionalAppointmentDto } from './dto/create-non-provisional-appointment.dto';
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

  async createProvisionalAppointment(
    createProvisionalApptDto: CreateGlobalAppointmentDto,
    transaction?: Transaction,
  ): Promise<any> {
    // check if this patient has a provisional appt.
    const { patientId } = createProvisionalApptDto;
    const hasAProvisional: boolean = await this.checkPatientHasAProvisionalAppointment(patientId, transaction);
    if (hasAProvisional) {
      throw new NotFoundException({
        fields: [],
        code: ErrorCodes.CONFLICTS,
        message: 'This Patient has a provisional appointment',
      });
    }
    return this.createAnAppointmentWithFullResponse(createProvisionalApptDto, transaction);
  }

  async createNonProvisionalAppointment(
    createNonProvisionalAppointmentDto: CreateNonProvisionalAppointmentDto,
  ): Promise<any> {
    let body;
    const { availabilityId } = createNonProvisionalAppointmentDto;
    this.logger.debug({
      function: 'createNonProvisionalAppointment 1',
      availabilityId,
    });
    const nonProvisionalAvailability = await this.availabilityService.findNotBookedAvailability(availabilityId);
    if (!nonProvisionalAvailability) {
      throw new ConflictException({
        fields: [],
        code: ErrorCodes.CONFLICTS,
        message: 'This availability has already booked!',
      });
    } else {
      const { startDate, appointmentTypeId, staffId } = nonProvisionalAvailability;
      const scheduleStatusId = await this.lookupsService.getStatusIdByCode(AppointmentStatusEnum.SCHEDULE);
      body = {
        date: startDate,
        startDate,
        appointmentTypeId,
        staffId,
        provisionalDate: startDate,
        appointmentStatusId: scheduleStatusId,
        ...nonProvisionalAvailability,
        ...createNonProvisionalAppointmentDto,
      };
      this.logger.debug({
        function: 'createNonProvisionalAppointment 2',
        nonProvisionalAvailability,
      });

      const result = await this.createAnAppointmentWithFullResponse(body);
      this.logger.debug({
        function: 'createNonProvisionalAppointment',
        result,
      });
      if (result && result.id) {
        const updateAvailability = await nonProvisionalAvailability.update(
          {
            appointmentId: result.id,
          },
          { where: { id: availabilityId } },
        );
        this.logger.debug({
          function: 'updateAvailability',
          updateAvailability,
        });
      }
      const actions = await this.lookupsService.findAppointmentsActions([result.appointmentStatusId]);
      return {
        ...result,
        primaryAction: actions[0].nextAction,
        secondaryActions: actions[0].secondaryActions,
        provisionalAppointment: !result.availabilityId,
      };
    }
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

  async checkPatientHasAProvisionalAppointment(patientId: number, transaction?: Transaction): Promise<boolean> {
    const waitListStatusId = await this.lookupsService.getStatusIdByCode(AppointmentStatusEnum.WAIT_LIST);
    const options: FindOptions = {
      where: {
        patientId,
        appointmentStatusId: waitListStatusId,
      },
    };
    if (transaction) {
      options.transaction = transaction;
    }
    const appt = await this.appointmentsRepository.findOne(options);
    this.logger.debug({
      function: 'checkPatientHasAProvisionalAppointment',
      appt,
      condition: !!appt && !!appt.id,
    });
    return !!appt && !!appt.id;
  }

  /**
   * Get patient next provisional appointment
   * @param patientId
   */
  async getPatientProvisionalAppointment(patientId: number): Promise<AppointmentsModel> {
    const waitListStatusId = await this.lookupsService.getStatusIdByCode(AppointmentStatusEnum.WAIT_LIST);
    const options: FindOptions = {
      where: {
        patientId,
        appointmentStatusId: waitListStatusId,
      },
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
