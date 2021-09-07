import { APPOINTMENT_REQUEST_REPOSITORY } from '../../common/constants';
import { AppointmentRequestsModel } from './models/appointment-requests.model';

export const appointmentRequestsProviders = [
  { provide: APPOINTMENT_REQUEST_REPOSITORY, useValue: AppointmentRequestsModel },
];
