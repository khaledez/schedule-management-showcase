/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, Inject, BadRequestException, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { APPOINTMENTS_REPOSITORY, DEFAULT_EVENT_DURATION_MINS } from '../../common/constants/index';
import { AppointmentsModel, AppointmentsModelAttributes } from './models/appointments.model';
import { CreateGlobalAppointmentDto } from './dto/create-global-appointment.dto';
import { ExtendAppointmentDto } from './dto/extend-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { ReassignAppointmentDto } from './dto/reassign-appointment.dto';
import { ChangeDoctorAppointmentDto } from './dto/change-doctor-appointment.dto';
import { LookupsService } from '../lookups/lookups.service';
import { ErrorCodes } from 'src/common/enums/error-code.enum';
import { sequelizeFilterMapper } from 'src/utils/sequelize-filter.mapper';
import { AvailabilityService } from '../availability/availability.service';
import { QueryAppointmentsByPeriodsDto } from './dto/query-appointments-by-periods.dto';
import { Op, FindOptions, Transaction, CreateOptions, UpdateOptions } from 'sequelize';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';
import { sequelizeSortMapper } from 'src/utils/sequelize-sort.mapper';
import { CreateNonProvisionalAppointmentDto } from './dto/create-non-provisional-appointment.dto';
import { AppointmentStatusEnum } from 'src/common/enums/appointment-status.enum';
import { map } from 'lodash';
import * as moment from 'moment';
import { PagingInfoInterface } from 'src/common/interfaces/pagingInfo.interface';
import { DateTime } from 'luxon';
import { EventsService } from '../events/events.service';
import { UpComingAppointmentQueryDto } from './dto/upcoming-appointment-query.dto';
import { PatientsModel } from './models/patients.model';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @Inject(APPOINTMENTS_REPOSITORY)
    private readonly appointmentsRepository: typeof AppointmentsModel,
    private readonly lookupsService: LookupsService,
    private readonly availabilityService: AvailabilityService,
    private readonly eventsService: EventsService,
  ) {}

  private readonly associationFieldsFilterNames = {
    patientFullName: `$patient.full_name$`,
    patientHealthPlanNumber: `$patient.primary_health_plan_number$`,
    time: `$availability.start_time$`,
  };
  private readonly associationFieldsSortNames = {
    STATUS: {
      relation: 'status',
      column: 'code',
    },
  };

  // TODO: MMX-later add scopes at the appointment types/status/actions
  // TODO: MMX-S3 handle datatype any.
  // TODO: MMX-currentSprint handle returning type.
  // TODO: MMX-later handle pagination
  // eslint-disable-next-line complexity
  async findAll(args?): Promise<any> {
    this.logger.debug({
      function: 'service/appt/findAll Line0',
      args,
    });
    const { query, identity, pagingInfo = {} } = args;
    const { limit, offset, reverseSort } = pagingInfo as PagingInfoInterface;
    this.logger.debug({
      function: 'service/appt/findAll Line1',
      pagingInfo,
      query,
      limit,
      offset,
    });
    // custom filter by appointmentCategory
    const filterByAppointmentCategory = this.handleAppointmentCategoryFilter(query, this.logger);

    // common filters
    const sequelizeFilter = sequelizeFilterMapper(
      this.logger,
      query,
      this.associationFieldsFilterNames,
      filterByAppointmentCategory,
    );
    const sequelizeSort = sequelizeSortMapper(this.logger, query, this.associationFieldsSortNames, reverseSort);
    this.logger.debug({
      function: 'BEFORE => service/appt/findAll sequelizeFilter, sequelizeSort',
      sequelizeFilter,
      sequelizeSort,
    });
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
          ...sequelizeFilter,
          clinicId: identity.clinicId,
          upcomingAppointment: true
        },
        order: sequelizeSort,
        limit,
        offset,
      };
      const { rows: appointments, count } = await this.appointmentsRepository.scope('active').findAndCountAll(options);
      this.logger.log({
        function: 'service/appt/findAll options',
        options,
        appointments,
      });
      const appointmentsStatusIds = [];
      const appointmentsAsPlain = appointments.map((e) => {
        appointmentsStatusIds.push(e.status.id);
        return e.get({ plain: true });
      });
      this.logger.debug({
        function: 'service/appt/findall status',
        appointmentsStatusIds,
      });
      const actions = await this.lookupsService.findAppointmentsActions(appointmentsStatusIds);
      this.logger.debug({
        function: 'service/appt/findall action',
        actions,
      });

      return {
        data: appointmentsAsPlain.map((appt: AppointmentsModel, i) => ({
          ...appt,
          previousAppointment: appt.previousAppointmentId,
          primaryAction: actions[i]?.nextAction ? actions[i].nextAction : [],
          secondaryActions: actions[i]?.secondaryActions ? actions[i].secondaryActions : [],
          provisionalAppointment: !appt.availabilityId,
        })),
        // TODO: calculate has previous data
        hasPreviousPage: false,
        count,
      };
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
    const appointment = await this.appointmentsRepository.scope('active').findByPk(id, {
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

    const { patientId } = dto;
    const startDate = DateTime.fromJSDate(dto.date);

    const inputAttr: AppointmentsModelAttributes = {
      ...dto,
      appointmentStatusId,
      date: startDate.toISODate(),
      startTime: startDate.toSQLTime({ includeOffset: false, includeZone: false }),
      durationMinutes: DEFAULT_EVENT_DURATION_MINS, // TODO support receiving duration minutes from user
      endDate: startDate.plus({ minutes: DEFAULT_EVENT_DURATION_MINS }).toJSDate(),
      provisionalDate: dto.provisionalDate ? dto.provisionalDate : startDate.toJSDate(),
      staffId: dto.doctorId,
    };

    this.logger.debug({
      title: 'appointment create payload',
      payload: inputAttr,
    });

    const options: CreateOptions = {};
    if (transaction) {
      options.transaction = transaction;
    }

    //change other appointments upcoming_appointment field to 0
    await this.appointmentsRepository.update(
      { upcomingAppointment: false },
      { where: { patientId } }
      );

    const result = await this.appointmentsRepository.create(inputAttr, options);

    // attach this appointment the event
    if (dto.availabilityId) {
      await this.eventsService.addAppointmentToEventByAvailability(dto.createdBy, dto.availabilityId, result.id);
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

  async findAppointmentByPatientId(
    id: number,
    queryData: UpComingAppointmentQueryDto,
    identity,
  ): Promise<AppointmentsModel> {
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
    }
    const { data } = await this.findAll({
      identity,
      query,
    });
    return data[0];
  }

  // async filterAppointments(data) {
  //   return this.appointmentsRepository.findAll();
  // }
  // OUT-OF-SCOPE: MMX-S3
  // find by id and update the appointment
  async findAndUpdateAppointment(
    appointmentId: number,
    appointmentFields: any, // TODO: create optional fields interface.
  ): Promise<AppointmentsModel> {
    // you might think why i do like this instead of update it in one query like update where id.
    // the reason here that i need the result, update at mysql return value of effected rows.
    // TODO: check the status/date, if it's already passed you have to throw error
    const appointment: AppointmentsModel = await this.appointmentsRepository.scope('active').findByPk(appointmentId);
    if (!appointment) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Appointment Not Found!',
      });
    }
    try {
      return await appointment.update(appointmentFields);
    } catch (error) {
      throw new BadRequestException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: error.message,
        error,
      });
    }
  }

  // OUT-OF-SCOPE: MMX-S3
  async deprecateThenCreateAppointment(
    appointmentFieldsDataToCreate: any, //TODO create interface.
  ): Promise<AppointmentsModel> {
    try {
      const { prev_appointment_id: appointmentIdToDeprecate } = appointmentFieldsDataToCreate;
      const oldAppointment: AppointmentsModel = await this.findAndUpdateAppointment(appointmentIdToDeprecate, {
        upcoming_appointment: false,
      });
      // GOAL: exclude the own data for an appointment
      const {
        id,
        createdAt,
        updatedAt,
        upcomingAppointment,
        ...othersData
      } = oldAppointment.toJSON() as AppointmentsModel;
      this.logger.log({
        id,
        createdAt,
        updatedAt,
        upcomingAppointment,
        ...othersData,
        ...appointmentFieldsDataToCreate,
      });
      return await this.appointmentsRepository.create({
        ...othersData,
        ...appointmentFieldsDataToCreate,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // OUT-OF-SCOPE: MMX-S3
  async extendDate(extendAppointmentDto: ExtendAppointmentDto): Promise<AppointmentsModel> {
    try {
      return await this.deprecateThenCreateAppointment(extendAppointmentDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // OUT-OF-SCOPE: MMX-S3
  async cancelAppointment(cancelAppointmentDto: CancelAppointmentDto): Promise<AppointmentsModel> {
    try {
      return await this.deprecateThenCreateAppointment(cancelAppointmentDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // OUT-OF-SCOPE: MMX-S3
  async reassignAppointment(reassignAppointmentDto: ReassignAppointmentDto): Promise<AppointmentsModel> {
    try {
      return await this.deprecateThenCreateAppointment(reassignAppointmentDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // OUT-OF-SCOPE: MMX-S3
  async changeDoctorAppointment(changeDoctorAppointmentDto: ChangeDoctorAppointmentDto): Promise<AppointmentsModel> {
    try {
      return await this.deprecateThenCreateAppointment(changeDoctorAppointmentDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
          model: PatientsModel,
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
}
