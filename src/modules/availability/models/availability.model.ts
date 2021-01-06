import { Table, Column, HasOne, ForeignKey } from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base-model';
import { AppointmentsModel } from '../../appointments/models/appointments.model';

@Table({ tableName: 'availability' })
export class AvailabilityModel extends BaseModel {
  @Column
  doctor_id: number;

  @Column
  @ForeignKey(() => AppointmentsModel)
  appointment_id: number;

  @Column
  type: string;

  @Column
  start_time: string;

  @Column
  date: Date;

  @Column
  duration_minutes: number;

  @HasOne(() => AppointmentsModel)
  appointment: AppointmentsModel;
}
