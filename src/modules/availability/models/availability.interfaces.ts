import { Optional } from 'sequelize/types';
import { BaseModelAttributes, BaseModelCreationAttributes } from '../../../common/models';

export interface AvailabilityModelAttributes extends BaseModelAttributes {
  doctorId?: number;
  appointmentId?: number;
  appointmentTypeId: number;
  date: Date;
  startTime: string;
  endDate: Date;
  durationMinutes: number;
}

export type AvailabilityCreationAttributes = Optional<
  AvailabilityModelAttributes,
  BaseModelCreationAttributes & 'appointmentId'
>;
