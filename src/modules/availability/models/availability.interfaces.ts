import { Optional } from 'sequelize/types';
import { BaseModelAttributes, BaseModelCreationAttributes } from '../../../common/models';

export interface AvailabilityModelAttributes extends BaseModelAttributes {
  staffId: number;
  appointmentId?: number;
  appointmentTypeId: number;
  startDate: Date;
  startTime: string;
  endDate: Date;
  durationMinutes: number;
}

export type AvailabilityCreationAttributes = Optional<
  AvailabilityModelAttributes,
  BaseModelCreationAttributes & 'appointmentId'
>;
