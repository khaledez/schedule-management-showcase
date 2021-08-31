/* Base */
export const SERVICE_NAME = 'serviceName'; // caution : don't change this line
export const SEQUELIZE = 'SEQUELIZE'; // caution : don't change this line
export const CONFIG_SERVICE = 'ConfigService'; // caution : don't change this line
export const PORT = 'port'; // caution : don't change this line

/* Repositories */
export const APPOINTMENTS_REPOSITORY = 'APPOINTMENTS_REPOSITORY';
export const AVAILABILITY_REPOSITORY = 'AVAILABILITY_REPOSITORY';
export const AVAILABILITY_TEMPLATE_REPOSITORY = 'AVAILABILITY_TEMPLATE_REPOSITORY';
export const AVAILABILITY_SLOT_REPOSITORY = 'AVAILABILITY_SLOT_REPOSITORY';
export const PATIENT_INFO_REPOSITORY = 'PATIENT_INFO_REPOSITORY';
export const EVENTS_REPOSITORY = 'EVENTS_REPOSITORY';
export const DURATION_MINUTES_LOOKUPS_REPOSITORY = 'DURATION_MINUTES_LOOKUPS_REPOSITORY';
export const TIME_GROUPS_LOOKUPS_REPOSITORY = 'TIME_GROUPS_LOOKUPS_REPOSITORY';
export const APPOINTMENT_ACTIONS_LOOKUPS_REPOSITORY = 'APPOINTMENT_ACTIONS_LOOKUPS_REPOSITORY';
export const APPOINTMENT_TYPES_LOOKUPS_REPOSITORY = 'APPOINTMENT_TYPES_LOOKUPS_REPOSITORY';
export const APPOINTMENT_STATUS_LOOKUPS_REPOSITORY = 'APPOINTMENT_STATUS_LOOKUPS_REPOSITORY';
export const APPOINTMENT_VISIT_MODE_LOOKUP_REPOSITORY = 'APPOINTMENT_VISIT_MODE_LOOKUP_REPOSITORY';
export const APPOINTMENT_CANCEL_RESCHEDUEL_REASON_REPOSITORY = 'APPOINTMENT_CANCEL_RESCHEDUEL_REASON_REPOSITORY';

/* Defaults */
export const DEFAULT_EVENT_DURATION_MINS = 15;
export const DEFAULT_APPOINTMENT_THRESHOLD_DAYS = 3;

export const MIN_TO_MILLI_SECONDS = 60_000;
export const MIN_TO_SECONDS = 60;
export const HOUR_TO_SECONDS = 3_600;
export const DAY_TO_MILLI_SECOND = 86_400_000;

export const APPOINTMENT_SUGGESTIONS_QUERY_LIMIT = 50;
export const APPOINTMENT_SUGGESTIONS_RETURN_LIMIT = 9;
export const APPOINTMENT_PROXIMITY_DAYS = 90;

export const BAD_REQUEST = 'BAD_REQUEST';

/* Events & Topics */
export const VISIT_COMPLETE_EVENT_NAME = 'visit_complete';
export const ABORT_VISIT_EVENT_NAME = 'ABORT_VISIT_EVENT';
export const APPOINTMENT_CHECKIN_STATUS_EVENT = 'appointment_checkin';
export const APPOINTMENT_CHANGE_PATIENT_ASSIGNED_DOCTOR = 'APPOINTMENT_CHANGE_PATIENT_ASSIGNED_DOCTOR';

export const SCHEDULE_MGMT_TOPIC = 'schedule-management';
export const VISIT_MGMT_TOPIC = 'visit-management';
export const PATIENT_MGMT_TOPIC = 'patient-management';

export const EVENT_PROVISIONAL_PAST = 'PROVISIONAL_PAST';
export const EVENT_APPOINTMENT_NOT_CONFIRMED = 'APPOINTMENT_NOT_CONFIRMED';
export const EVENT_APPOINTMENT_MISSED = 'APPOINTMENT_MISSED';

/* Querying */
export const PAGING_LIMIT_DEFAULT = 10;
export const PAGING_OFFSET_DEFAULT = 0;
