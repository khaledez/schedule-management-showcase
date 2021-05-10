import { AvailabilityModelAttributes } from '../models/availability.interfaces';

export interface BulkUpdateResult {
  created?: Array<AvailabilityModelAttributes>;
  update?: Array<AvailabilityModelAttributes>;
  errors?: Array<unknown>;
}
