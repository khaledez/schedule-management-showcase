import { BaseModel } from 'common/models/base.model';
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
  implements AvailabilityModelAttributes
{
  @Column
  staffId: number;

  @Column
  @ForeignKey(() => AppointmentsModel)
  appointmentId: number;

  @Column
  @ForeignKey(() => AppointmentTypesLookupsModel)
  appointmentTypeId: number;

  @IsDate
  @Column({ field: 'date' })
  startDate: Date;

  @Column
  startTime: string;

  @IsDate
  @Column
  endDate: Date;

  @Column
  durationMinutes: number;

  @HasOne(() => AppointmentsModel)
  appointment: AppointmentsModel;

  @BelongsTo(() => AppointmentTypesLookupsModel, 'appointmentTypeId')
  type: AppointmentTypesLookupsModel;
}
