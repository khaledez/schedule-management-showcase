import { AVAILABILITY_REPOSITORY } from '../../common/constants';
import { AvailabilityModel } from './models/availability.model';

export const availabilityProviders = [{ provide: AVAILABILITY_REPOSITORY, useValue: AvailabilityModel }];
