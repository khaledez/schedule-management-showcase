import { AvailabilityModelAttributes } from '../models/availability.interfaces';

export interface BulkUpdateResult {
  created?: Array<AvailabilityModelAttributes>;
  updated?: Array<AvailabilityModelAttributes>;
  errors?: Array<unknown>;
}
