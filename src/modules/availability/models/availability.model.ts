import {
  Table,
  Column,
  HasOne,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base-model';
import { AppointmentsModel } from '../../appointments/models/appointments.model';
import { AppointmentTypesLookupsModel } from '../../lookups/models/appointment-types.model';

@Table({ tableName: 'availability', underscored: true })
export class AvailabilityModel extends BaseModel {
  @Column
  doctorId: number;

  @Column
  clinicId: number;

  @Column
  @ForeignKey(() => AppointmentsModel)
  appointmentId: number;

  @Column
  startTime: string;

  @Column
  @ForeignKey(() => AppointmentTypesLookupsModel)
  appointmentTypeId: number;

  @Column
  date: Date;

  @Column
  durationMinutes: number;

  @HasOne(() => AppointmentsModel)
  appointment: AppointmentsModel;

  @BelongsTo(() => AppointmentTypesLookupsModel, 'appointmentTypeId')
  appointmentType: AppointmentTypesLookupsModel;
}
