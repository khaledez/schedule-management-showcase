import { APPOINTMENTS_REPOSITORY } from 'common/constants';
import { AppointmentsModel } from './appointments.model';

export const appointmentsProviders = [{ provide: APPOINTMENTS_REPOSITORY, useValue: AppointmentsModel }];
