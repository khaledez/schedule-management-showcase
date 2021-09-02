import { LookupsModel } from 'common/models/lookup.model';
import { Column, Table } from 'sequelize-typescript';
import { LookupWithCodeAttributes } from '.';

@Table({ tableName: 'AppointmentStatusLookups', underscored: true })
export class AppointmentStatusLookupsModel
  extends LookupsModel<LookupWithCodeAttributes>
  implements LookupWithCodeAttributes {
  @Column
  code: string;

  @Column
  inTransit: boolean;
}
