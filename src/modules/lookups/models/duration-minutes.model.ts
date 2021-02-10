import { Table, Column } from 'sequelize-typescript';
import { LookupsModel } from '../../../common/models/lookup-model';

@Table({ tableName: 'DurationMinutesLookups', underscored: true })
export class DurationMinutesLookupsModel extends LookupsModel {
  @Column
  value: number;
}
