import { DateTime } from 'luxon';
import { MIN_TO_MILLI_SECONDS } from 'common/constants';

export function addMinutesToDate(startDateTime: Date, durationMinutes: number) {
  const dateInMilli = startDateTime.getTime();
  const endDateTimeInMilli = dateInMilli + durationMinutes * MIN_TO_MILLI_SECONDS;
  return new Date(endDateTimeInMilli);
}

/**
 * Subtract {@link hours} from {@link fromDate}
 * @param fromDate Date to be subtracted from
 * @param hours Number of hours to subtract
 */
export function subtractHoursFromJsDate(fromDate: Date, hours: number) {
  return DateTime.fromJSDate(fromDate)
    .minus({
      hours,
    })
    .toJSDate();
}

/**
 * Subtract {@link minutes} from {@link fromDate}
 * @param fromDate Date to be subtracted from
 * @param minutes Number of hours to subtract
 */
export function subtractMinutesFromJsDate(fromDate: Date, minutes: number) {
  return DateTime.fromJSDate(fromDate)
    .minus({
      minutes,
    })
    .toJSDate();
}
