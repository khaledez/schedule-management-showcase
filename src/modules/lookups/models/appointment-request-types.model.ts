import { Column, Table } from 'sequelize-typescript';
import { LookupWithCodeAttributes } from '.';
import { LookupsModel } from '../../../common/models/lookup.model';

@Table({ tableName: 'AppointmentRequestTypesLookups', underscored: true })
export class AppointmentRequestTypesLookupsModel
  extends LookupsModel<LookupWithCodeAttributes>
  implements LookupWithCodeAttributes
{
  @Column
  code: string;

  @Column
  apptStatusNameEn: string;

  @Column
  apptStatusNameFr: string;
}
