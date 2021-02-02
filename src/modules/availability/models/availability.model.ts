import { Table, Column, HasOne, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base-model';
import { AppointmentsModel } from '../../appointments/models/appointments.model';
import { IsOptional } from 'class-validator';

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
  appointmentTypeId: string;

  @Column
  date: Date;

  @Column
  durationMinutes: number;

  @HasOne(() => AppointmentsModel)
  appointment: AppointmentsModel;
}
