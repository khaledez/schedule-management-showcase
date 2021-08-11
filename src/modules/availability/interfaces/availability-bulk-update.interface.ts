import { AvailabilityModelAttributes } from '../models/availability.interfaces';

export interface BulkUpdateResult {
  created?: Array<AvailabilityMutationResult>;
  updated?: Array<AvailabilityMutationResult>;
  errors?: Array<unknown>;
}

export interface AvailabilityMutationResult extends AvailabilityModelAttributes {
  entryType: 'AVAILABILITY';
}
