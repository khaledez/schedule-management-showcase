import {
  Table,
  Column,
  IsDate,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base-model';
import { AvailabilityModel } from '../../availability/models/availability.model';

// note that the id will auto added by sequalize.
@Table({ tableName: 'appointments' })
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
  type_id: number;

  @Column
  clinic_id: number;

  @IsDate
  @Column
  date: Date;

  @Column
  status_id: number;

  @Column
  priority_id: number;

  @Column
  start_time: string;

  @Column
  complains: string;

  @Column
  clinical_notes: string;

  @Column
  rescheduling_reason: string;

  @Column
  cancellation_reason: string;

  @Column
  doctor_reassignment_reason: string;

  @Column
  date_extension_reason: string;

  @BelongsTo(() => AvailabilityModel)
  availability: AvailabilityModel;

  @Column
  upcoming_appointment: boolean;
}
