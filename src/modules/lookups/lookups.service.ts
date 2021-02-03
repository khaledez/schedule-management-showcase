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
    private readonly AppointmentActionsLookupsRepository: typeof AppointmentActionsLookupsModel,
    @Inject(APPOINTMENT_TYPES_LOOKUPS_REPOSITORY)
    private readonly AppointmentTypesLookupsRepository: typeof AppointmentTypesLookupsModel,
    @Inject(APPOINTMENT_STATUS_LOOKUPS_REPOSITORY)
    private readonly AppointmentStatusLookupsRepository: typeof AppointmentStatusLookupsModel,
  ) {}

  //TODO: handle clinic_id logic
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
    return this.AppointmentActionsLookupsRepository.findAll({
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
    return this.AppointmentTypesLookupsRepository.findAll({
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
    return this.AppointmentStatusLookupsRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: arrayOfOrToFind,
        },
      },
    });
  }
}
