import { Table, Column } from 'sequelize-typescript';
import { LookupsModel, LookupsModelAttributes } from '../../../common/models/lookup.model';

export interface TimeGroupsLookupsAttributes extends LookupsModelAttributes {
  startTime: string;
  endTime: string;
}
@Table({ tableName: 'TimeGroupsLookups', underscored: true })
export class TimeGroupsLookupsModel
  extends LookupsModel<TimeGroupsLookupsAttributes>
  implements TimeGroupsLookupsAttributes
{
  @Column
  startTime: string;

  @Column
  endTime: string;
}
