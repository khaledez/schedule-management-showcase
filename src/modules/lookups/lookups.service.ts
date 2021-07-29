import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { FindOptions, Op } from 'sequelize';
import {
  APPOINTMENT_ACTIONS_LOOKUPS_REPOSITORY,
  APPOINTMENT_STATUS_LOOKUPS_REPOSITORY,
  APPOINTMENT_TYPES_LOOKUPS_REPOSITORY,
  DURATION_MINUTES_LOOKUPS_REPOSITORY,
  TIME_GROUPS_LOOKUPS_REPOSITORY,
} from 'common/constants';
import { AppointmentActionEnum } from 'common/enums';
import { AppointmentStatusEnum } from 'common/enums/appointment-status.enum';
import { AppointmentActionsLookupsModel } from './models/appointment-actions.model';
import { AppointmentStatusLookupsModel } from './models/appointment-status.model';
import { AppointmentTypesLookupsModel } from './models/appointment-types.model';
import { DurationMinutesLookupsModel } from './models/duration-minutes.model';
import { TimeGroupsLookupsModel } from './models/time-groups.model';
import { IIdentity } from '@dashps/monmedx-common';

@Injectable()
export class LookupsService {
  private readonly logger = new Logger(LookupsService.name);

  constructor(
    @Inject(DURATION_MINUTES_LOOKUPS_REPOSITORY)
    private readonly durationMinutesLookupsRepository: typeof DurationMinutesLookupsModel,
    @Inject(TIME_GROUPS_LOOKUPS_REPOSITORY)
    private readonly timeGroupsLookupsRepository: typeof TimeGroupsLookupsModel,
    @Inject(APPOINTMENT_ACTIONS_LOOKUPS_REPOSITORY)
    private readonly appointmentActionsLookupsRepository: typeof AppointmentActionsLookupsModel,
    @Inject(APPOINTMENT_TYPES_LOOKUPS_REPOSITORY)
    private readonly appointmentTypesLookupsRepository: typeof AppointmentTypesLookupsModel,
    @Inject(APPOINTMENT_STATUS_LOOKUPS_REPOSITORY)
    private readonly appointmentStatusLookupsRepository: typeof AppointmentStatusLookupsModel,
  ) {}
  /**
   *
   * Find the duration minutes in the system + clinic if it exists
   * @param identity xmmx user identifiers
   * duration minutes like 5 Mins, 15 Mins or 30.
   */
  public findAllDurationMinutesLookups(identity): Promise<DurationMinutesLookupsModel[]> {
    const { clinicId } = identity;
    return this.durationMinutesLookupsRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: [null, clinicId],
        },
      },
    });
  }
  /**
   * Find time groups in the system + clinic if it exists
   * @param identity
   * lookup example: morning, afternoon, evening
   */
  public findAllTimeGroupsLookups(identity): Promise<TimeGroupsLookupsModel[]> {
    const { clinicId } = identity;
    return this.timeGroupsLookupsRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: [null, clinicId],
        },
      },
    });
  }
  /**
   * Find appointment actions
   * @param identity
   * example: CANCEL, CHANGE_APPT_TYPE, CHANGE_DOCTOR
   */
  public findAllAppointmentActionsLookups(identity): Promise<AppointmentActionsLookupsModel[]> {
    const { clinicId } = identity;
    return this.appointmentActionsLookupsRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: [null, clinicId],
        },
      },
    });
  }
  /**
   * Find Appointment types
   * @param identity
   * example: NEW, FUP
   */
  public findAllAppointmentTypesLookups(identity?): Promise<AppointmentTypesLookupsModel[]> {
    const conditions: FindOptions<AppointmentTypesLookupsModel> = identity?.clinicId
      ? {
          where: {
            clinicId: {
              [Op.or]: [null, identity.clinicId],
            },
          },
        }
      : {};

    return this.appointmentTypesLookupsRepository.findAll(conditions);
  }
  /**
   * Find Appointment status
   * @param identity
   * example: READY, CHECK-IN
   */
  public findAllAppointmentStatusLookups(identity): Promise<AppointmentStatusLookupsModel[]> {
    const { clinicId } = identity;
    return this.appointmentStatusLookupsRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: [null, clinicId],
        },
      },
    });
  }

  //TODO: MMX-CurrentSprint => static value
  nextAppointmentActions = {
    WAIT_LIST: [
      AppointmentActionEnum.CHANGE_DATE,
      AppointmentActionEnum.CHANGE_APPT_TYPE,
      AppointmentActionEnum.CHANGE_DOCTOR,
    ],
    SCHEDULE: [
      AppointmentActionEnum.CANCEL,
      AppointmentActionEnum.CHANGE_DATE,
      AppointmentActionEnum.CHANGE_APPT_TYPE,
      AppointmentActionEnum.RESCHEDULE_APPT,
    ],
    CONFIRM: [AppointmentActionEnum.CANCEL, AppointmentActionEnum.CHANGE_APPT_TYPE],
    CHECK_IN: [AppointmentActionEnum.CANCEL],
    READY: [AppointmentActionEnum.CANCEL],
    COMPLETE: [],
  };

  /**
   * find Appointments Primary And Secondary Actions By Array Of Status Ids
   * @param ids AppointmentsStatusId
   */
  public async findAppointmentsActions(ids: Array<number>) {
    try {
      const internalAppointmentsStatus = this.appointmentStatusLookupsRepository.findAll();
      const internalAppointmentsActions = await this.appointmentActionsLookupsRepository.findAll();
      const appointmentActionsPlain = internalAppointmentsActions.map((e) => e.get({ plain: true }));

      const nextActions = {
        WAIT_LIST: ['SCHEDULE'],
        SCHEDULE: ['CONFIRM'],
        CONFIRM: ['CHECK_IN'],
        CHECK_IN: ['READY'],
        READY: ['COMPLETE'],
        COMPLETE: [],
        CANCELED: [],
      };

      const internalStatuses = await internalAppointmentsStatus;
      // TODO: MMX-S4/S5 create fcm and check the status
      // At S2 status are sorted in the order so the next id is next status
      const appointmentsPrimaryActions = ids.map((id: number) => {
        const statusData = internalStatuses.find((statusObj) => statusObj.id === id);
        return {
          currentActionId: id,
          // next status type calculated depend ids !!!
          // nextAction: internalAppointmentsStatus.find((statusObj) => statusObj.id === id + 1),
          nextAction: internalStatuses.find((statusObj) => statusObj.code === nextActions[statusData.code][0]),
        };
      });

      //TODO: MMX-later change the static way to dynamic.
      //TODO: MMX-CurrentSprint => static value
      const secondaryAppointmentActions = {
        WAIT_LIST: ['CHANGE_DATE', 'CHANGE_APPT_TYPE', 'CHANGE_DOCTOR'],
        SCHEDULE: ['CANCEL', 'CHANGE_DATE', 'CHANGE_APPT_TYPE', 'RESCHEDULE_APPT'],
        CONFIRM: ['CANCEL', 'CHANGE_APPT_TYPE'],
        CHECK_IN: ['CANCEL'],
        READY: ['CANCEL'],
        COMPLETE: [],
      };

      const appointmentsActions = appointmentsPrimaryActions.map((action) => ({
        ...action,
        secondaryActions: action.nextAction
          ? appointmentActionsPlain.filter((e: AppointmentActionsLookupsModel) =>
              secondaryAppointmentActions[action.nextAction.code].includes(e.code),
            )
          : [],
      }));

      return appointmentsActions;
    } catch (error) {
      throw new BadRequestException({
        function: 'findAppointmentsActions error',
        error,
      });
    }
  }

  public async getStatusIdByCode(code: AppointmentStatusEnum): Promise<number> {
    if (!Object.keys(AppointmentStatusEnum).includes(code)) {
      throw new BadRequestException({
        fields: [],
        code: 'NOT_FOUND',
        message: 'This status does not exits!',
      });
    }
    const result = await this.appointmentStatusLookupsRepository.findOne({
      where: {
        code,
      },
      attributes: ['id'],
    });
    return result.id;
  }

  async getTypeByCode(code: string) {
    const result = await this.appointmentTypesLookupsRepository.findOne({
      where: {
        code,
      },
      attributes: ['id'],
    });
    return result?.id;
  }

  /**
   * Validate if a given list of appointments ids are valid types
   *
   * @param appointmentTypesIds List of the appointment ids to be validated
   * @param identity
   */
  public async validateAppointmentsTypes(appointmentTypesIds: Array<number>, identity: IIdentity): Promise<void> {
    const allAppointmentTypes = await this.findAllAppointmentTypesLookups(identity);
    const validTypesIds: Set<number> = new Set(allAppointmentTypes.map((appointmentType) => appointmentType.id));
    const invalidIds = [];
    appointmentTypesIds.forEach((typeId) => {
      if (!validTypesIds.has(typeId)) {
        invalidIds.push(typeId);
      }
    });
    if (invalidIds.length !== 0) {
      throw new BadRequestException({
        message: "The appointment types doesn't exist",
        ids: invalidIds,
      });
    }
  }
}
