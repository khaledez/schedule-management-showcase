import {
  DURATION_MINUTES_LOOKUPS_REPOSITORY,
  TIME_GROUPS_LOOKUPS_REPOSITORY,
  APPOINTMENT_TYPES_LOOKUPS_REPOSITORY,
  APPOINTMENT_STATUS_LOOKUPS_REPOSITORY,
  APPOINTMENT_ACTIONS_LOOKUPS_REPOSITORY,
} from '../../common/constants';
import { DurationMinutesLookupsModel } from './models/duration-minutes.model';
import { TimeGroupsLookupsModel } from './models/time-groups.model';
import { AppointmentStatusLookupsModel } from './models/appointment-status.model';
import { AppointmentTypesLookupsModel } from './models/appointment-types.model';
import { AppointmentActionsLookupsModel } from './models/appointment-actions.model';

export const lookupsProviders = [
  {
    provide: DURATION_MINUTES_LOOKUPS_REPOSITORY,
    useValue: DurationMinutesLookupsModel,
  },
  {
    provide: APPOINTMENT_ACTIONS_LOOKUPS_REPOSITORY,
    useValue: AppointmentActionsLookupsModel,
  },
  {
    provide: TIME_GROUPS_LOOKUPS_REPOSITORY,
    useValue: TimeGroupsLookupsModel,
  },
  {
    provide: APPOINTMENT_TYPES_LOOKUPS_REPOSITORY,
    useValue: AppointmentTypesLookupsModel,
  },
  {
    provide: APPOINTMENT_STATUS_LOOKUPS_REPOSITORY,
    useValue: AppointmentStatusLookupsModel,
  },
];
