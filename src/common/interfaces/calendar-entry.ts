import { CalendarType } from 'common/enums/calendar-type';
import { BaseModelAttributes } from 'common/models';

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
