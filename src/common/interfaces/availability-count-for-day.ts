import { BaseModelAttributes } from 'common/models';

export interface AvailabilityCountForDay extends BaseModelAttributes {
  date: string;
  count: number;
}
