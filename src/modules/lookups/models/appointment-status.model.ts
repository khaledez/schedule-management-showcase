import { Table, Column, HasMany } from 'sequelize-typescript';
import { LookupsModel } from '../../../common/models/lookup-model';
import { AppointmentsModel } from '../../appointments/models/appointments.model';

@Table({ tableName: 'AppointmentStatusLookups', underscored: true })
export class AppointmentStatusLookupsModel extends LookupsModel {
  @Column
  code: string;

  @HasMany(() => AppointmentsModel, 'appointmentStatusId')
  appointment?: AppointmentsModel[];
}
