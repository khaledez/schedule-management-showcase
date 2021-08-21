import { DateTime } from 'luxon';
import { MIN_TO_MILLI_SECONDS } from 'common/constants';

export function addMinutesToDate(startDateTime: Date, durationMinutes: number) {
  const dateInMilli = startDateTime.getTime();
  const endDateTimeInMilli = dateInMilli + durationMinutes * MIN_TO_MILLI_SECONDS;
  return new Date(endDateTimeInMilli);
}

export function addMinutesToStringDate(startDateTime: string, durationMinutes: number) {
  return addMinutesToDate(DateTime.fromISO(startDateTime).toJSDate(), durationMinutes);
}
