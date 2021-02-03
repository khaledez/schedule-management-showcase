import {
  Table,
  Column,
  IsDate,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base-model';
import { AvailabilityModel } from '../../availability/models/availability.model';
import { AppointmentStatusLookupsModel } from '../../lookups/models/appointment-status.model';
import { AppointmentActionsLookupsModel } from '../../lookups/models/appointment-actions.model';
import { AppointmentTypesLookupsModel } from '../../lookups/models/appointment-types.model';

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
  @ForeignKey(() => AppointmentTypesLookupsModel)
  appointmentTypeId: number;

  @Column
  clinicId: number;

  @IsDate
  @Column
  date: Date;

  @IsDate
  @Column
  provisionalDate: Date;

  @Column
  @ForeignKey(() => AppointmentStatusLookupsModel)
  appointmentStatusId: number;

  @Column
  cancelRescheduleText: string;

  @Column
  @ForeignKey(() => AppointmentActionsLookupsModel)
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
