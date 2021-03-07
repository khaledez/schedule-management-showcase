import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { APPOINTMENTS_REPOSITORY } from '../../common/constants/index';
import { AppointmentsModel } from './models/appointments.model';
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
import { Op, FindOptions } from 'sequelize';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';
import { sequelizeSortMapper } from 'src/utils/sequelize-sort.mapper';
import { CreateNonProvisionalAppointmentDto } from './dto/create-non-provisional-appointment.dto';
import { AppointmentStatusEnum } from 'src/common/enums/appointment-status.enum';
import { ConfigService } from '@nestjs/config';
import { map } from 'lodash';
import * as moment from 'moment';
import { PagingInfoInterface } from 'src/common/interfaces/pagingInfo.interface';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @Inject(APPOINTMENTS_REPOSITORY)
    private readonly appointmentsRepository: typeof AppointmentsModel,
    private readonly lookupsService: LookupsService,
    private readonly availabilityService: AvailabilityService,
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
    const { query, identity, pagingInfo } = args;
    const { limit, offset } = pagingInfo as PagingInfoInterface;
    this.logger.debug({
      function: 'service/appt/findAll Line1',
      pagingInfo,
      query,
    });
    // custom filter by appointmentCategory
    const filterByAppointmentCategory = this.handleAppointmentCategoryFilter(
      query,
      this.logger,
    );

    // common filters
    const sequelizeFilter = sequelizeFilterMapper(
      this.logger,
      query,
      this.associationFieldsFilterNames,
      filterByAppointmentCategory,
    );
    const sequelizeSort = sequelizeSortMapper(
      this.logger,
      query,
      this.associationFieldsSortNames,
    );
    this.logger.debug({
      function: 'BEFORE => service/appt/findAll sequelizeFilter, sequelizeSort',
      sequelizeFilter,
      sequelizeSort,
    });
    try {
      const options: FindOptions = {
        include: [
          {
            all: true,
          },
        ],
        where: {
          ...sequelizeFilter,
          clinicId: identity.clinicId,
        },
        order: sequelizeSort,
        limit,
        offset,
      };
      const {
        rows: appointments,
        count,
      } = await this.appointmentsRepository.findAndCountAll(options);
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
      const actions = await this.lookupsService.findAppointmentsActions(
        appointmentsStatusIds,
      );
      this.logger.debug({
        function: 'service/appt/findall action',
        actions,
      });

      return {
        data: appointmentsAsPlain.map((appt: AppointmentsModel, i) => ({
          ...appt,
          previousAppointment: appt.previousAppointmentId,
          primaryAction: actions[i].nextAction && actions[i].nextAction,
          secondaryActions: actions[i].secondaryActions,
          provisionalAppointment: !appt.availabilityId,
        })),
        // TODO: calculate has previous data
        hasPreviousPage: false,
        count,
      };
    } catch (error) {
      this.logger.error({
        function: 'service/appt/findall catch error',
        error,
      });
      throw new BadRequestException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'Failed to find the appointments',
        error,
      });
    }
  }

  async createProvisionalAppointment(
    createProvisionalApptDto: CreateGlobalAppointmentDto,
  ): Promise<any> {
    // check if this patient has a provisional appt.
    const { patientId } = createProvisionalApptDto;
    const hasAProvisional: boolean = await this.checkPatientHasAProvisionalAppointment(
      patientId,
    );
    if (hasAProvisional) {
      throw new NotFoundException({
        fields: [],
        code: ErrorCodes.CONFLICTS,
        message: 'This Patient has a provisional appointment',
      });
    }
    return this.createAnAppointmentWithFullResponse(createProvisionalApptDto);
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
    const nonProvisionalAvailability = await this.availabilityService.findNotBookedAvailability(
      availabilityId,
    );
    if (!nonProvisionalAvailability) {
      throw new ConflictException({
        fields: [],
        code: ErrorCodes.CONFLICTS,
        message: 'This availability has already booked!',
      });
    } else {
      const { date, appointmentTypeId, doctorId } = nonProvisionalAvailability;
      const scheduleStatusId = await this.lookupsService.getStatusIdByCode(
        AppointmentStatusEnum.SCHEDULE,
      );
      body = {
        date,
        appointmentTypeId,
        doctorId,
        provisionalDate: date,
        appointmentStatusId: scheduleStatusId,
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
      if (result && result.appointment && result.appointment.id) {
        const updateAvailability = await nonProvisionalAvailability.update({
          appointmentId: result.appointment.id,
        });
        this.logger.debug({
          function: 'updateAvailability',
          updateAvailability,
        });
      }
      return result;
    }
  }

  async findOne(id: number): Promise<any> {
    const appointment = await this.appointmentsRepository.findByPk(id, {
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
    const actions = await this.lookupsService.findAppointmentsActions([
      appointment.appointmentStatusId,
    ]);
    return {
      ...appointmentAsPlain,
      primaryAction: actions[0].nextAction,
      secondaryActions: actions[0].secondaryActions,
      provisionalAppointment: !appointment.availabilityId,
    };
  }

  async checkPatientHasAProvisionalAppointment(
    patientId: number,
  ): Promise<boolean> {
    const appt = await this.appointmentsRepository.scope('id').findOne({
      attributes: ['id'],
      where: {
        patientId,
        availabilityId: {
          [Op.eq]: null,
        },
      },
    });
    this.logger.debug({
      function: 'checkPatientHasAProvisionalAppointment',
      appt,
      condition: !!appt && !!appt.id,
    });
    return !!appt && !!appt.id;
  }

  async createAnAppointmentWithFullResponse(
    appointmentToCreate: CreateGlobalAppointmentDto,
  ): Promise<{ appointment: AppointmentsModel }> {
    this.logger.debug({
      function: 'appointmentToCreate',
      appointmentToCreate,
    });
    const result = await this.appointmentsRepository
      .scope('id')
      .create(appointmentToCreate);

    this.logger.debug({
      function: 'createAnAppointmentWithFullResponse',
      result,
      appointmentToCreate,
    });
    return {
      appointment: await this.findOne(result.id),
    };
  }

  // eslint-disable-next-line complexity
  readonly handleAppointmentCategoryFilter = (
    { filter = {} },
    logger: Logger,
  ):
    | { name: string; filter: Record<string, unknown> }
    | Record<string, unknown> => {
    try {
      const filterName = 'appointmentCategory';
      const waitlist = 'WAITLIST';
      const appt = 'APPOINTMENT';
      const isApptCategoryFilterExist =
        Object.keys(filter).findIndex((e) => e === filterName) !== -1;
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
        throw new BadRequestException(
          `Not supported filter on appointmentCategory`,
        );
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
  async patchAppointment(id: number, data: any): Promise<AppointmentsModel> {
    await this.appointmentsRepository.scope('id').update(data, {
      where: {
        id,
      },
    });
    return this.findOne(id);
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
    const appointment: AppointmentsModel = await this.appointmentsRepository.findByPk(
      appointmentId,
    );
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
      const {
        prev_appointment_id: appointmentIdToDeprecate,
      } = appointmentFieldsDataToCreate;
      const oldAppointment: AppointmentsModel = await this.findAndUpdateAppointment(
        appointmentIdToDeprecate,
        { upcoming_appointment: false },
      );
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
  async extendDate(
    extendAppointmentDto: ExtendAppointmentDto,
  ): Promise<AppointmentsModel> {
    try {
      return await this.deprecateThenCreateAppointment(extendAppointmentDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // OUT-OF-SCOPE: MMX-S3
  async cancelAppointment(
    cancelAppointmentDto: CancelAppointmentDto,
  ): Promise<AppointmentsModel> {
    try {
      return await this.deprecateThenCreateAppointment(cancelAppointmentDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // OUT-OF-SCOPE: MMX-S3
  async reassignAppointment(
    reassignAppointmentDto: ReassignAppointmentDto,
  ): Promise<AppointmentsModel> {
    try {
      return await this.deprecateThenCreateAppointment(reassignAppointmentDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // OUT-OF-SCOPE: MMX-S3
  async changeDoctorAppointment(
    changeDoctorAppointmentDto: ChangeDoctorAppointmentDto,
  ): Promise<AppointmentsModel> {
    try {
      return await this.deprecateThenCreateAppointment(
        changeDoctorAppointmentDto,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAppointmentsByPeriods(
    clinicId: number,
    query: QueryAppointmentsByPeriodsDto,
  ): Promise<any> {
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
    const result = await this.appointmentsRepository.count({
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
      ],
      where,
    });

    return map(result, ({ count, date }: { count: number; date: string }) => ({
      count,
      date: moment(date).format('YYYY-MM-DD'),
    }));
  }
}
