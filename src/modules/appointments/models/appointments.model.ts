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
  patientId: number;

  @Column
  doctorId: number;

  @Column
  @ForeignKey(() => AvailabilityModel)
  availabilityId: number;

  @Column
  prev_appointmentId: number;

  @Column
  appointment_typeId: number;

  @Column
  clinicId: number;

  @IsDate
  @Column
  date: Date;

  @IsDate
  @Column
  provisionalDate: Date;

  @Column
  appointmentStatusId: number;

  @Column
  cancelRescheduleText: string;

  @Column
  cancelRescheduleReasonId: number;

  @BelongsTo(() => AvailabilityModel)
  availability: AvailabilityModel;

  @Column
  upcomingAppointment: boolean;

  @Column
  canceledBy: number;

  @Column
  canceledAt: Date;
}
