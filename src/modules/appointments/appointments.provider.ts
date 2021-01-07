import { APPOINTMENTS_REPOSITORY } from '../../common/constants';
import { AppointmentsModel } from './models/appointments.model';

export const appointmentsProviders = [
  { provide: APPOINTMENTS_REPOSITORY, useValue: AppointmentsModel },
];
