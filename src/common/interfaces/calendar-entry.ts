import { CalendarType } from 'common/enums/calendar-type';
import { BaseModelAttributes } from 'common/models';

export interface CalendarEntry extends BaseModelAttributes {
  entryType?: CalendarType;
  __typename?: string;

  startDate: Date;
  endDate: Date;
  durationMinutes: number;
  staffId?: number;
}
