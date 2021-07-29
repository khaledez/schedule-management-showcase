import { Column, HasMany, Table } from 'sequelize-typescript';
import { LookupWithCodeAttributes } from '.';
import { LookupsModel } from '../../../common/models/lookup.model';
import { AppointmentsModel } from '../../appointments/appointments.model';

@Table({ tableName: 'AppointmentStatusLookups', underscored: true })
export class AppointmentStatusLookupsModel
  extends LookupsModel<LookupWithCodeAttributes>
  implements LookupWithCodeAttributes {
  @Column
  code: string;

  @HasMany(() => AppointmentsModel, 'appointmentStatusId')
  appointment?: AppointmentsModel[];
}
