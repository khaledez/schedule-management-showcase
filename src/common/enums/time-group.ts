import { TimeGroup } from 'common/interfaces/time-group-period';

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
