import { AvailabilityModel } from '../models/availability.model';

export interface CreateOrUpdateAvailabilityResponseInterface {
  created: AvailabilityModel[];
  deleted: number[];
}
