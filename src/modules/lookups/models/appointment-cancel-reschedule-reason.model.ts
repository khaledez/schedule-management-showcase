import { LookupsModel } from 'common/models';
import { Column, Table } from 'sequelize-typescript';
import { LookupWithCodeAttributes } from '.';

@Table({ tableName: 'AppointmentCancelRescheduleReasonLookup', underscored: true })
export class AppointmentCancelRescheduleReasonLookupModel
  extends LookupsModel<LookupWithCodeAttributes>
  implements LookupWithCodeAttributes {
  @Column
  code: string;
}
