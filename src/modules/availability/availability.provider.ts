import { AVAILABILITY_REPOSITORY } from 'common/constants';
import { AvailabilityModel } from './models/availability.model';
import { AvailabilityValidator } from 'modules/availability/availability.validator';

export const availabilityProviders = [
  { provide: AVAILABILITY_REPOSITORY, useValue: AvailabilityModel },
  AvailabilityValidator,
];
