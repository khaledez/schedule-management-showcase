import { Injectable, Inject, Logger } from '@nestjs/common';
import { DurationMinutesLookupsModel } from './models/duration-minutes.model';
import {
  DURATION_MINUTES_LOOKUPS_REPOSITORY,
  TIME_GROUPS_LOOKUPS_REPOSITORY,
  APPOINTMENT_TYPES_LOOKUPS_REPOSITORY,
  APPOINTMENT_STATUS_LOOKUPS_REPOSITORY,
  APPOINTMENT_ACTIONS_LOOKUPS_REPOSITORY,
} from 'src/common/constants';
import { TimeGroupsLookupsModel } from './models/time-groups.model';
import { Op } from 'sequelize';
import { AppointmentActionsLookupsModel } from './models/appointment-actions.model';
import { AppointmentTypesLookupsModel } from './models/appointment-types.model';
import { AppointmentStatusLookupsModel } from './models/appointment-status.model';

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

  //TODO: MMX-currentSprint handle clinic_id logic
  public findAllDurationMinutesLookups(
    clinicId?: number,
  ): Promise<DurationMinutesLookupsModel[]> {
    const arrayOfOrToFind = [null];
    if (clinicId) {
      arrayOfOrToFind.push(clinicId);
    }
    return this.durationMinutesLookupsRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: arrayOfOrToFind,
        },
      },
    });
  }

  public findAllTimeGroupsLookups(
    clinicId?: number,
  ): Promise<TimeGroupsLookupsModel[]> {
    const arrayOfOrToFind = [null];
    if (clinicId) {
      arrayOfOrToFind.push(clinicId);
    }
    return this.timeGroupsLookupsRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: arrayOfOrToFind,
        },
      },
    });
  }

  public findAllAppointmentActionsLookups(
    clinicId?: number,
  ): Promise<AppointmentActionsLookupsModel[]> {
    const arrayOfOrToFind = [null];
    if (clinicId) {
      arrayOfOrToFind.push(clinicId);
    }
    return this.appointmentActionsLookupsRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: arrayOfOrToFind,
        },
      },
    });
  }
  public findAllAppointmentTypesLookups(
    clinicId?: number,
  ): Promise<AppointmentTypesLookupsModel[]> {
    const arrayOfOrToFind = [null];
    if (clinicId) {
      arrayOfOrToFind.push(clinicId);
    }
    return this.appointmentTypesLookupsRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: arrayOfOrToFind,
        },
      },
    });
  }
  public findAllAppointmentStatusLookups(
    clinicId?: number,
  ): Promise<AppointmentStatusLookupsModel[]> {
    const arrayOfOrToFind = [null];
    if (clinicId) {
      arrayOfOrToFind.push(clinicId);
    }
    return this.appointmentStatusLookupsRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: arrayOfOrToFind,
        },
      },
    });
  }

  /**
   * find Appointments Primary And Secondary Actions By Array Of Status Ids
   * @param ids AppointmentsStatusId
   */
  public async findAppointmentsActions(ids: Array<number>) {
    const internalAppointmentsStatus = await this.appointmentStatusLookupsRepository.findAll(
      {
        attributes: ['id', 'code'],
      },
    );
    this.logger.debug({
      function: 'service/lookup/findAppointmentsActions',
      internalAppointmentsStatus,
    });

    // TODO: MMX-S4/S5 create fcm and check the status
    // At S2 status are sorted in the order so the next id is next status
    const appointmentsPrimaryActions = ids.map((id: number) => {
      return {
        currentActionId: id,
        nextAction: internalAppointmentsStatus.find(
          (statusObj) => statusObj.id === id + 1,
        ),
      };
    });
    //TODO: MMX-later change the static way to dynamic.
    // S2 => static value
    const nextAppointmentActions = {
      WAIT_LIST: ['CHANGE_DATE', 'CHANGE_APPT_TYPE', 'CHANGE_DOCTOR'],
      SCHEDULE: [
        'CANCEL',
        'CHANGE_DATE',
        'CHANGE_APPT_TYPE',
        'RESCHEDULE_APPT',
      ],
      CONFIRM: ['CANCEL', 'CHANGE_APPT_TYPE'],
      CHECK_IN: ['CANCEL'],
      READY: ['CANCEL'],
      COMPLETED: [],
    };

    const appointmentsActions = appointmentsPrimaryActions.map((action) => ({
      ...action,
      secondaryActions:
        action.nextAction && nextAppointmentActions[action.nextAction.code],
    }));
    this.logger.debug({
      function: 'service/lookup/findAppointmentsActions',
      appointmentsPrimaryActions,
      appointmentsActions,
    });
    return appointmentsActions;
  }

  public async findAppointmentPrimaryActionByStatusId(
    statusId: number,
  ): Promise<AppointmentStatusLookupsModel> | null {
    const allStatus = await this.findAllAppointmentStatusLookups();
    // TODO: handle if the id does not exits.
    const currentStatusObject =
      allStatus.length && allStatus.find(({ id }) => statusId === id);
    // TODO: put the complete status as constant!
    if (currentStatusObject && currentStatusObject.code === 'COMPLETE') {
      return null;
    }
    return allStatus.find(({ id }) => id === statusId + 1);
  }
}
