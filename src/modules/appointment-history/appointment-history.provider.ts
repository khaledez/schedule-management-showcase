import { APPOINTMENT_STATUS_HISTORY_REPOSITORY } from 'common/constants';
import { AppointmentStatusHistoryModel } from './models/appointment-status-history.model';
import { AppointmentHistoryService } from './appointment-history.service';

export const appointmentHistoryProviders = [
  { provide: APPOINTMENT_STATUS_HISTORY_REPOSITORY, useValue: AppointmentStatusHistoryModel },
  AppointmentHistoryService,
];
