import { Injectable, Inject } from '@nestjs/common';
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

  // TODO: MMX-later make this like data loader receive ids and returns array.
  public async findAppointmentSecondaryActionByStatusId(
    statusId: number,
  ): Promise<string[]> | null {
    const allActions = await this.findAllAppointmentActionsLookups();
    const currentStatus = await this.appointmentStatusLookupsRepository.findByPk(
      statusId,
    );
    // TODO:: handle if the id does not exists
    if (!currentStatus || !currentStatus.code) {
      return null;
    }
    const nextAppointmentAcions = {
      WAIT_LIST: ['CHANGE_DATE', 'CHANGE_APPT_TYPE', 'CHANGE_DOCTOR'],
      SCHEDULE: [
        'CANCEL',
        'CHANGE_DATE',
        'CHANGE_APPT_TYPE',
        'RESCHEDULE_APPT',
      ],
    };
    if (currentStatus && currentStatus.code) {
      if (currentStatus.code === 'WAIT_LIST') {
        allActions.find((e) =>
          ['CHANGE_DATE', 'CHANGE_APPT_TYPE', 'CHANGE_DOCTOR'].includes(e.code),
        );
      }
    }
  }
}
