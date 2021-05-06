import { FilterIdsInputDto, FilterStringInputDto } from '@dashps/monmedx-common';
import { FilterAvailabilityInputDto, ResultWithErrors, FilterDateInputDto } from 'src/common/dtos';
import { BaseModelAttributes } from 'src/common/models';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';
import { AppointmentTypesLookupsModel } from '../lookups/models/appointment-types.model';

export type CalendarType = 'EVENT' | 'APPOINTMENT' | 'AVAILABILITY';

export interface CalendarEntry extends BaseModelAttributes {
  entryType: CalendarType;

  // deprecated - use startDate instead
  date?: Date;
  // deprecated
  startTime?: string;
  // deprecated - use endDate instead
  endTime?: string;

  startDate: Date;
  endDate: Date;
  durationMinutes?: number;
  title?: string;
  staffId: number;

  __typename: string;
}

export interface Invitee {
  email: string;
}

export interface CalendarEvent extends CalendarEntry {
  invitees?: Invitee[];
  colorCode?: string;
  descriptionRich?: string;
}

export type CalendarAvailability = CalendarEntry;

export interface CalendarAppointment extends CalendarEntry {
  patientId: number;
  availabilityId?: number;
  previousAppointment?: CalendarAppointment;
  status?: AppointmentStatusLookupsModel; // TODO might need to be changed
  type?: AppointmentTypesLookupsModel; // TODO for sure it need to be changed
  provisionalDate?: Date;
  cancelRescheduleText?: string;
  //  cancelRescheduleReason?: CancelAppointmentBodyDto;
  upcomingAppointment?: boolean;
  provisionalAppointment?: boolean;
  canceledAt: Date;
  canceledBy: number;
  secondaryActions?: Array<string>;
  primaryAction?: string;
}

export interface CalendarSearchResult extends ResultWithErrors {
  entries?: CalendarEntry[];
}

export interface CalendarSearchInput {
  entryType?: FilterStringInputDto;
  dateRange?: FilterDateInputDto;
  timezoneId?: string; // TODO support it or remove it
  staffId?: FilterIdsInputDto;
  availabilityFilter?: FilterAvailabilityInputDto;
}
