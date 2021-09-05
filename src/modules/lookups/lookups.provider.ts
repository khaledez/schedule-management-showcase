import {
  APPOINTMENT_ACTIONS_LOOKUPS_REPOSITORY,
  APPOINTMENT_CANCEL_RESCHEDULE_REASON_REPOSITORY,
  APPOINTMENT_REQUEST_STATUS_LOOKUPS_REPOSITORY,
  APPOINTMENT_REQUEST_TYPES_LOOKUPS_REPOSITORY,
  APPOINTMENT_STATUS_LOOKUPS_REPOSITORY,
  APPOINTMENT_TYPES_LOOKUPS_REPOSITORY,
  APPOINTMENT_VISIT_MODE_LOOKUP_REPOSITORY,
  DURATION_MINUTES_LOOKUPS_REPOSITORY,
  TIME_GROUPS_LOOKUPS_REPOSITORY,
} from 'common/constants';
import { AppointmentActionsLookupsModel } from './models/appointment-actions.model';
import { AppointmentCancelRescheduleReasonLookupModel } from './models/appointment-cancel-reschedule-reason.model';
import { AppointmentStatusLookupsModel } from './models/appointment-status.model';
import { AppointmentTypesLookupsModel } from './models/appointment-types.model';
import { AppointmentVisitModeLookupModel } from './models/appointment-visit-mode.model';
import { DurationMinutesLookupsModel } from './models/duration-minutes.model';
import { TimeGroupsLookupsModel } from './models/time-groups.model';
import { AppointmentRequestStatusLookupsModel } from './models/appointment-request-status.model';
import { AppointmentRequestTypesLookupsModel } from './models/appointment-request-types.model';

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
  { provide: APPOINTMENT_CANCEL_RESCHEDULE_REASON_REPOSITORY, useValue: AppointmentCancelRescheduleReasonLookupModel },
  { provide: APPOINTMENT_REQUEST_STATUS_LOOKUPS_REPOSITORY, useValue: AppointmentRequestStatusLookupsModel },
  { provide: APPOINTMENT_REQUEST_TYPES_LOOKUPS_REPOSITORY, useValue: AppointmentRequestTypesLookupsModel },
];
