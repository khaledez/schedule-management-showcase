import { Table, Column, HasOne, ForeignKey, BelongsTo, DefaultScope, Scopes, IsDate } from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base.model';
import { AppointmentsModel } from '../../appointments/models/appointments.model';
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
export class AvailabilityModel extends BaseModel<AvailabilityModelAttributes, AvailabilityCreationAttributes> {
  @Column({ field: 'staff_id' })
  doctorId: number;

  @Column
  @ForeignKey(() => AppointmentsModel)
  appointmentId: number;

  @Column
  @ForeignKey(() => AppointmentTypesLookupsModel)
  appointmentTypeId: number;

  @IsDate
  @Column
  date: Date;

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
