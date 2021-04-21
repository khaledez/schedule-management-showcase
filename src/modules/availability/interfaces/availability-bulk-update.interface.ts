import { AvailabilityModel } from '../models/availability.model';

export interface BulkUpdateResult {
  created?: Array<AvailabilityModel>;
  update?: Array<AvailabilityModel>;
  errors?: Array<unknown>;
}
