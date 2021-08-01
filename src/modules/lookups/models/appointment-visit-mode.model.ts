import { LookupsModel } from 'common/models';
import { Column, Table } from 'sequelize-typescript';
import { LookupWithCodeAttributes } from '.';

@Table({ tableName: 'AppointmentVisitModeLookup', underscored: true })
export class AppointmentVisitModeLookupModel
  extends LookupsModel<LookupWithCodeAttributes>
  implements LookupWithCodeAttributes
{
  @Column
  code: string;
}
