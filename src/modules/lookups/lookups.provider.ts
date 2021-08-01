import {
  APPOINTMENT_ACTIONS_LOOKUPS_REPOSITORY,
  APPOINTMENT_STATUS_LOOKUPS_REPOSITORY,
  APPOINTMENT_TYPES_LOOKUPS_REPOSITORY,
  APPOINTMENT_VISIT_MODE_LOOKUP_REPOSITORY,
  DURATION_MINUTES_LOOKUPS_REPOSITORY,
  TIME_GROUPS_LOOKUPS_REPOSITORY,
} from 'common/constants';
import { AppointmentActionsLookupsModel } from './models/appointment-actions.model';
import { AppointmentStatusLookupsModel } from './models/appointment-status.model';
import { AppointmentTypesLookupsModel } from './models/appointment-types.model';
import { AppointmentVisitModeLookupModel } from './models/appointment-visit-mode.model';
import { DurationMinutesLookupsModel } from './models/duration-minutes.model';
import { TimeGroupsLookupsModel } from './models/time-groups.model';

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
  {
    provide: APPOINTMENT_VISIT_MODE_LOOKUP_REPOSITORY,
    useValue: AppointmentVisitModeLookupModel,
  },
];
