import { FilterIdsInputDto, FilterStringInputDto } from '@dashps/monmedx-common';
import { FilterAvailabilityInputDto, FilterDateInputDto, ResultWithErrors } from 'common/dtos';
import { CalendarEntry } from 'common/interfaces/calendar-entry';

export interface CalendarSearchResult extends ResultWithErrors {
  entries?: CalendarEntry[];
}

export interface CalendarSearchInput {
  entryType?: FilterStringInputDto;
  dateRange?: FilterDateInputDto;
  staffId?: FilterIdsInputDto;
  availabilityFilter?: FilterAvailabilityInputDto;
}
