import { UserError } from 'common/interfaces/user-error.interface';
import { CalendarEntry } from 'common/interfaces/calendar-entry';

export class CalendarEntriesPayloadDto {
  entries?: CalendarEntry[];
  errors?: UserError[];
}
