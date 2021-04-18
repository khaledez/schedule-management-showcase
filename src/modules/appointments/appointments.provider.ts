import { APPOINTMENTS_REPOSITORY, PATIENTS_REPOSITORY } from '../../common/constants';
import { AppointmentsModel } from './models/appointments.model';
import { PatientsModel } from './models/patients.model';

export const appointmentsProviders = [
  { provide: APPOINTMENTS_REPOSITORY, useValue: AppointmentsModel },
  { provide: PATIENTS_REPOSITORY, useValue: PatientsModel },
];
