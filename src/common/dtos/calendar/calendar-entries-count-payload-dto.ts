import { UserError } from 'common/interfaces/user-error.interface';
import { AvailabilityCountForDay } from 'common/interfaces/availability-count-for-day';

export class CalendarEntriesCountPayloadDto {
  data?: AvailabilityCountForDay[];
  errors?: UserError[];
}
