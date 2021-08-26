import { CalendarEntry } from 'common/interfaces/calendar-entry';
import { BaseModelCreationAttributes } from 'common/models';
import { AppointmentsModelAttributes } from 'modules/appointments/appointments.model';
import { EventModelAttributes } from 'modules/events/models';
import { Optional } from 'sequelize/types';

export interface AvailabilityModelAttributes extends CalendarEntry {
  appointmentTypeId: number;
  isOccupied?: boolean;

  event?: EventModelAttributes;
  appointment?: AppointmentsModelAttributes;
}

export type AvailabilityCreationAttributes = Optional<AvailabilityModelAttributes, 'id' & BaseModelCreationAttributes>;
