import { TimeGroup } from 'common/interfaces/time-group-period';
import exp from 'constants';
import { HOUR_TO_SECONDS, MIN_TO_SECONDS } from 'common/constants';

export enum TimeGroupCode {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
}

const timeGroups = {
  [TimeGroupCode.MORNING]: { start: '08:00:00', end: '11:00:00' },
  [TimeGroupCode.AFTERNOON]: { start: '11:00:00', end: '15:00:00' },
  [TimeGroupCode.EVENING]: { start: '15:00:00', end: '18:00:00' },
};

export function getTimeGroup(code: TimeGroupCode | string): TimeGroup {
  return timeGroups[code] || null;
}

export function isInTimeGroup(date: Date, group: TimeGroup) {
  const dateTime = extractDayTimeInSeconds(date);
  const start = transformDayTimeToSeconds(group.start);
  const end = transformDayTimeToSeconds(group.end);
  return start <= dateTime && dateTime <= end;
}

export function extractDayTimeInSeconds(date: Date) {
  const dateTime = date.toISOString().match(/\d{2}:\d{2}:\d{2}/)[0];
  return transformDayTimeToSeconds(dateTime);
}

export function transformDayTimeToSeconds(time: string): number {
  const actualTime: string[] = time.split(':');
  return +actualTime[0] * HOUR_TO_SECONDS + +actualTime[1] * MIN_TO_SECONDS + +actualTime[2];
}
