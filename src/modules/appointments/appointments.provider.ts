import { APPOINTMENTS_REPOSITORY } from 'common/constants';
import { AppointmentsModel } from './appointments.model';
import { AppointmentsService } from './appointments.service';
import { AppointmentsListener } from './appointments.listener';
import { AppointmentsCron } from './appointments.cron';

export const appointmentsProviders = [
  { provide: APPOINTMENTS_REPOSITORY, useValue: AppointmentsModel },
  AppointmentsService,
  AppointmentsListener,
  AppointmentsCron,
];
