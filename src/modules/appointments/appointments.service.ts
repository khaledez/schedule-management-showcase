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
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ExtendAppointmentDto } from './dto/extend-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { ReassignAppointmentDto } from './dto/reassign-appointment.dto';
import { ChangeDoctorAppointmentDto } from './dto/change-doctor-appointment.dto';
import { LookupsService } from '../lookups/lookups.service';
import { Op, FindOptions } from 'sequelize';
import { PatientsModel } from './models/patients.model';
import { AvailabilityModel } from '../availability/models/availability.model';
import { AppointmentTypesLookupsModel } from '../lookups/models/appointment-types.model';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';
import { AppointmentActionsLookupsModel } from '../lookups/models/appointment-actions.model';
import { ErrorCodes } from 'src/common/enums/error-code.enum';
import { sequelizeFilterMapper } from 'src/utils/sequelize-filter.mapper';
import { AvailabilityService } from '../availability/availability.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @Inject(APPOINTMENTS_REPOSITORY)
    private readonly appointmentsRepository: typeof AppointmentsModel,
    private readonly lookupsService: LookupsService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  private readonly matchFiltersWithModelFields = {
    appointmentStatusIds: {
      isArray: true,
      dbField: 'appointmentStatusId',
      model: 'appointment',
    },
    appointmentTypeIds: {
      isArray: true,
      dbField: 'appointmentTypeId',
      model: 'appointment',
    },
    doctorIds: {
      isArray: true,
      dbField: 'doctorId',
      model: 'appointment',
    },
    patientFullName: {
      dbField: 'fullName',
      model: 'patient',
    },
    patientPrimaryHealthPlanNumber: {
      dbField: 'primaryHealthPlanNumber',
      model: 'patient',
    },
    appointmentStartTime: {
      dbField: 'startTime',
      model: 'availability',
    },
    ids: {
      dbField: 'id',
      model: 'appointment',
    },
  };

  /**
   *
   * @param query
   * this function do some logic for the find appointment options.
   * to do search at the appointment level you have to pass it with the filter
   * to do search at the nested level like patient/availability you have to pass it inside the include array
   * for example [{
   *  model
   *  as
   *  where: {fullName: ""}
   * }]
   */
  handleFindAllOptions(query): FindOptions {
    const filter = {};
    const includeArray = [
      {
        model: AvailabilityModel,
        as: 'availability',
      },
      {
        model: PatientsModel,
        as: 'patient',
      },
      {
        model: AppointmentTypesLookupsModel,
        as: 'type',
      },
      {
        model: AppointmentStatusLookupsModel,
        as: 'status',
      },
      {
        model: AppointmentActionsLookupsModel,
        as: 'cancelRescheduleReason',
      },
    ];

    Object.keys(query).forEach((filterName) => {
      this.logger.debug({
        function: 'handleFindAllOptions',
        filterName,
      });
      const {
        dbField,
        isArray = false,
        model,
      } = this.matchFiltersWithModelFields[filterName];
      if (model === 'appointment') {
        if (isArray) {
          filter[dbField] = query[filterName].split(',');
        } else {
          filter[dbField] = {
            [Op.like]: `%${query[filterName]}%`,
          };
        }
      } else {
        const includeIndexElement = includeArray.findIndex(
          (e) => e.as === model,
        );
        includeArray[includeIndexElement] = Object.assign(
          includeArray[includeIndexElement],
          {
            where: {
              [dbField]: {
                [Op.like]: `%${query[filterName]}%`,
              },
            },
          },
        );
      }
    });
    return {
      include: includeArray,
      where: {
        ...filter,
      },
    };
  }

  // TODO: MMX-later add scopes at the appointment types/status/actions
  // TODO: MMX-S3 handle datatype any.
  // TODO: MMX-later handle returning null if availabilityId/patientId is null.
  // TODO: MMX-currentSprint handle returning type.
  async findAll(params?): Promise<any> {
    const { query } = params;
    const options = this.handleFindAllOptions(query);
    this.logger.debug({
      function: 'BEFORE => service/appt/findAll',
      query,
      options,
    });
    try {
      const appointments = await this.appointmentsRepository.findAll(options);
      this.logger.debug({
        function: 'service/appt/findAll',
        appointments,
      });
      const appointmentsAsPlain = appointments.map((e) =>
        e.get({ plain: true }),
      );
      const appointmentsStatusIds = appointments.map(
        (e): number => e.appointmentStatusId,
      );
      this.logger.debug({
        function: 'service/appt/findall',
        appointmentsStatusIds,
      });
      const actions = await this.lookupsService.findAppointmentsActions(
        appointmentsStatusIds,
      );
      this.logger.debug({
        function: 'service/appt/findall',
        actions,
      });
      return {
        edges: appointmentsAsPlain.map((appt: AppointmentsModel, i) => ({
          node: {
            ...appt,
            previousAppointment: appt.previousAppointmentId,
            primaryAction: actions[i].nextAction && actions[i].nextAction,
            secondaryActions: actions[i].secondaryActions,
            provisionalAppointment: !appt.availabilityId,
          },
        })),
        pageInfo: {},
      };
    } catch (error) {
      this.logger.error({
        function: 'service/appt/findall',
        error,
      });
      throw new BadRequestException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'Failed to find the appointments',
        error,
      });
    }
  }
  /**
   *
   * @param createAppointmentDto
   * create an appointment
   * this function is used to create provisional and not provisional appt
   */
  // TODO: MMX-later we need an transaction
  // the reason why i did not make it right now because i need the full data which comes from findOne
  // findOne will not find the element during transaction. and create did not return full data.
  async create(createAppointmentDto: CreateAppointmentDto): Promise<any> {
    try {
      // that's mean this appt not a provisional.
      let preparedNotProvisionalAppointmentBody;
      if (createAppointmentDto.availabilityId) {
        const availability = await this.availabilityService.findOne(
          createAppointmentDto.availabilityId,
        );
        const {
          date,
          appointmentTypeId,
          doctorId,
          appointmentId,
        } = availability;
        if (appointmentId) {
          throw new ConflictException({
            fields: [],
            code: ErrorCodes.CONFLICTS,
            message: 'This availability has already booked!',
          });
        }
        preparedNotProvisionalAppointmentBody = {
          ...createAppointmentDto,
          date,
          appointmentTypeId,
          doctorId,
          provisionalDate: availability.date,
          appointmentStatusId: 2, // TODO: MMX-currentSprint: GET this from the db instead of use it manual status 2 = schedule
        };
      }
      const body = createAppointmentDto.availabilityId
        ? preparedNotProvisionalAppointmentBody
        : createAppointmentDto;
      const result = await this.appointmentsRepository.create(body);
      this.logger.debug({
        function: 'service/appt/create',
        result,
      });
      const actions = await this.lookupsService.findAppointmentsActions([
        result.appointmentStatusId,
      ]);

      this.logger.debug({
        function: 'service/appt/create',
        actions,
      });
      const createdAppointment = await this.appointmentsRepository.findOne({
        where: {
          id: result.id,
        },
        include: [
          {
            all: true,
          },
        ],
      });
      if (!createdAppointment) {
        throw new BadRequestException({
          fields: [],
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'Failed to create an appointment',
        });
      }
      const appointmentPlain = createdAppointment.get({ plain: true });

      this.logger.debug({
        function: 'service/appt/create',
        createdAppointment,
        appointmentPlain,
      });
      return {
        ...appointmentPlain,
        primaryAction: actions[0].nextAction,
        secondaryActions: actions[0].secondaryActions,
        provisionalAppointment: !createdAppointment.availabilityId,
      };
    } catch (error) {
      this.logger.error({
        function: 'service/appt/createAppointmentDto',
        error,
      });
      throw new BadRequestException({
        fields: [],
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'CatchError: Failed to create an appointment',
        error,
      });
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
        code: 'NOT_FOUND',
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
}
