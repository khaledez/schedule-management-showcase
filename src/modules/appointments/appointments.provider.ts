import {
    APPOINTMENTS_REPOSITORY,
} from '../../common/constants';
import { AppointmentsModel } from './models/appointments.model';

export const userProviders = [
    { provide: APPOINTMENTS_REPOSITORY, useValue: AppointmentsModel },
];