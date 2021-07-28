import { Column, Table } from 'sequelize-typescript';
import { LookupsModel, LookupsModelAttributes } from '../../../common/models/lookup.model';

export interface DurationMinutesLookupsAttributes extends LookupsModelAttributes {
  value: number;
}

@Table({ tableName: 'DurationMinutesLookups', underscored: true })
export class DurationMinutesLookupsModel
  extends LookupsModel<DurationMinutesLookupsAttributes>
  implements DurationMinutesLookupsAttributes
{
  @Column
  value: number;
}
