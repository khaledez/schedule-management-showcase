import { EVENT_APPOINTMENT_MISSED, EVENT_APPOINTMENT_NOT_CONFIRMED, EVENT_PROVISIONAL_PAST } from '../constants/index';
export type CronSupportedEvents =
  | typeof EVENT_PROVISIONAL_PAST
  | typeof EVENT_APPOINTMENT_MISSED
  | typeof EVENT_APPOINTMENT_NOT_CONFIRMED;
