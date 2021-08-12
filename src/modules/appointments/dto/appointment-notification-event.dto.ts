import { CronSupportedEvents } from 'common/enums/cron-supported-events';
export class AppointmentNotificationEvent {
  eventName: CronSupportedEvents;
  source: string;
  clinicId: number;
  staffId: number;
  patientId: number;
  appointmentDate: string;
  appointmentTime: string;
  appointmentThresholdDays?: number;
}
