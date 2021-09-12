import { APPOINTMENT_REQUEST_FEATURE_REPOSITORY, APPOINTMENT_REQUEST_REPOSITORY } from '../../common/constants';
import { AppointmentRequestFeatureStatusModel, AppointmentRequestsModel } from './models';

export const appointmentRequestsProviders = [
  { provide: APPOINTMENT_REQUEST_REPOSITORY, useValue: AppointmentRequestsModel },
  { provide: APPOINTMENT_REQUEST_FEATURE_REPOSITORY, useValue: AppointmentRequestFeatureStatusModel },
];
