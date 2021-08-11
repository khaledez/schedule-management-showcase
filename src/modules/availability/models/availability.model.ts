import { BaseModel } from 'common/models/base.model';
import { EventModel } from 'modules/events/models';
import { BelongsTo, Column, DefaultScope, ForeignKey, HasOne, IsDate, Scopes, Table } from 'sequelize-typescript';
import { AppointmentsModel } from '../../appointments/appointments.model';
import { AppointmentTypesLookupsModel } from '../../lookups/models/appointment-types.model';
import { AvailabilityCreationAttributes, AvailabilityModelAttributes } from './availability.interfaces';

@DefaultScope(() => ({
  attributes: {
    exclude: ['deletedAt', 'deletedBy'],
  },
}))
@Scopes(() => ({
  full: {
    exclude: ['deletedAt', 'deletedBy'],
    include: [
      {
        model: AppointmentTypesLookupsModel,
        as: 'type',
      },
    ],
  },
}))
@Table({ tableName: 'Availability', underscored: true })
export class AvailabilityModel
  extends BaseModel<AvailabilityModelAttributes, AvailabilityCreationAttributes>
  implements AvailabilityModelAttributes {
  @Column
  staffId: number;

  @Column
  @ForeignKey(() => AppointmentTypesLookupsModel)
  appointmentTypeId: number;

  @Column
  isOccupied: boolean;

  @IsDate
  @Column({ field: 'date' })
  startDate: Date;

  @IsDate
  @Column
  endDate: Date;

  @Column
  durationMinutes: number;

  @HasOne(() => AppointmentsModel)
  appointment?: AppointmentsModel;

  @HasOne(() => EventModel, 'availabilityId')
  event?: EventModel;

  @BelongsTo(() => AppointmentTypesLookupsModel, 'appointmentTypeId')
  type: AppointmentTypesLookupsModel;
}
