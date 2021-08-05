import { Column, Table } from 'sequelize-typescript';
import { LookupWithCodeAttributes } from '.';
import { LookupsModel } from '../../../common/models/lookup.model';

export interface TimeGroupsLookupsAttributes extends LookupWithCodeAttributes {
  startTime: string;
  endTime: string;
}
@Table({ tableName: 'TimeGroupsLookups', underscored: true })
export class TimeGroupsLookupsModel
  extends LookupsModel<TimeGroupsLookupsAttributes>
  implements TimeGroupsLookupsAttributes
{
  @Column
  code: string;

  @Column
  startTime: string;

  @Column
  endTime: string;
}
