import { Column, HasMany, Table } from 'sequelize-typescript';
import { LookupWithCodeAttributes } from '.';
import { LookupsModel } from '../../../common/models/lookup.model';
import { AppointmentsModel } from '../../appointments/appointments.model';

@Table({ tableName: 'AppointmentActionsLookups', underscored: true })
export class AppointmentActionsLookupsModel
  extends LookupsModel<LookupWithCodeAttributes>
  implements LookupWithCodeAttributes {
  @Column
  code: string;

  @HasMany(() => AppointmentsModel, 'cancelRescheduleReasonId')
  appointment?: AppointmentsModel[];
}
