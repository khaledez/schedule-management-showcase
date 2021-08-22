import { Column, DefaultScope, HasMany, Table } from 'sequelize-typescript';
import { LookupWithCodeAttributes } from '.';
import { LookupsModel } from '../../../common/models/lookup.model';
import { AppointmentsModel } from '../../appointments/appointments.model';

@DefaultScope(() => ({
  attributes: {
    exclude: ['deletedAt', 'deletedBy', 'updatedAt', 'createdAt', 'createdBy', 'updatedBy'],
  },
}))
@Table({ tableName: 'AppointmentActionsLookups', underscored: true })
export class AppointmentActionsLookupsModel
  extends LookupsModel<LookupWithCodeAttributes>
  implements LookupWithCodeAttributes {
  @Column
  code: string;

  @HasMany(() => AppointmentsModel, 'cancelRescheduleReasonId')
  appointment?: AppointmentsModel[];
}
