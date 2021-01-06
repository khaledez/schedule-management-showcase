import {
  Table,
  Column,
  IsDate,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base-model';
import { AvailabilityModel } from '../../availability/models/availability.model';

@Table({ tableName: 'appointments' })
export class AppointmentsModel extends BaseModel {
  @Column
  patient_id: number;

  @Column
  assigned_doctor_id: number;

  @Column
  @ForeignKey(() => AvailabilityModel)
  availability_id: number;

  @Column
  old_appointment_id: number;

  @Column
  type: string;

  @Column
  @IsDate
  provisional_date: Date;

  @Column
  booked_date: Date;

  @Column
  status: string;

  @Column
  priority: string;

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
}
