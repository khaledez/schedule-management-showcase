import { FilterDateInputDto, FilterIdsInputDto, FilterStringInputDto } from '@monmedx/monmedx-common';
import { ResultWithErrors } from 'common/dtos';
import { CalendarEntry } from 'common/interfaces/calendar-entry';

export interface DayCalendarEntry {
  __typename: 'DayCalendarEntry';
  date: string;
  entries: CalendarEntry[];
  total: number;
}

export interface CalendarSearchResult extends ResultWithErrors {
  entries?: DayCalendarEntry[] | CalendarEntry[];
}

export interface CalendarSearchInput {
  entryType?: FilterStringInputDto;
  dateRange?: FilterDateInputDto;
  dateTimeRange?: FilterDateInputDto;
  staffId?: FilterIdsInputDto;
  appointmentTypeId?: FilterIdsInputDto;
  appointmentStatusId?: FilterIdsInputDto;
  maxDayCount?: number;
}
