import {
  Table,
  Column,
  IsDate,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base-model';
import { AvailabilityModel } from '../../availability/models/availability.model';

// note that the id will auto added by sequelize.
@Table({ tableName: 'appointments', underscored: true })
export class AppointmentsModel extends BaseModel {
  @Column
  patient_id: number;

  @Column
  doctor_id: number;

  @Column
  @ForeignKey(() => AvailabilityModel)
  availability_id: number;

  @Column
  prev_appointment_id: number;

  @Column
  appointment_type_id: number;

  @Column
  clinic_id: number;

  @IsDate
  @Column
  date: Date;

  @IsDate
  @Column
  provisional_date: Date;

  @Column
  appointment_status_id: number;

  @Column
  cancel_reschedule_text: string;

  @Column
  cancel_reschedule_reason_id: number;

  @BelongsTo(() => AvailabilityModel)
  availability: AvailabilityModel;

  @Column
  upcoming_appointment: boolean;

  @Column
  canceled_by: number;

  @Column
  canceled_at: Date;
}
