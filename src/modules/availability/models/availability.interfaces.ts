import { BaseModelAttributes, BaseModelCreationAttributes } from 'common/models';
import { AppointmentsModelAttributes } from 'modules/appointments/appointments.model';
import { EventModelAttributes } from 'modules/events/models';
import { Optional } from 'sequelize/types';

export interface AvailabilityModelAttributes extends BaseModelAttributes {
  staffId: number;
  appointmentTypeId: number;
  startDate: Date;
  endDate: Date;
  durationMinutes: number;
  isOccupied?: boolean;

  event?: EventModelAttributes;
  appointment?: AppointmentsModelAttributes;
}

export type AvailabilityCreationAttributes = Optional<AvailabilityModelAttributes, 'id' & BaseModelCreationAttributes>;
