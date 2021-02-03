import { Table, Column } from 'sequelize-typescript';
import { LookupsModel } from '../../../common/models/lookup-model';

@Table({ tableName: 'TimeGroupsLookups', underscored: true })
export class TimeGroupsLookupsModel extends LookupsModel {
  @Column
  start_time: string;

  @Column
  end_time: string;
}
