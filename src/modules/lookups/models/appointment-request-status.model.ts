import { Column, HasMany, Table } from 'sequelize-typescript';
import { LookupWithCodeAttributes } from '.';
import { LookupsModel } from '../../../common/models/lookup.model';

@Table({ tableName: 'AppointmentRequestStatusLookups', underscored: true })
export class AppointmentRequestStatusLookupsModel
  extends LookupsModel<LookupWithCodeAttributes>
  implements LookupWithCodeAttributes {
  @Column
  code: string;
}