import { Table, Column, DefaultScope } from 'sequelize-typescript';
import { LookupsModel } from '../../../common/models/lookup-model';

@DefaultScope(() => ({
  attributes: {
    include: ['id', 'clinicId', 'nameEn', 'nameFr', 'startTime', 'endTime'],
  },
}))
@Table({ tableName: 'TimeGroupsLookups', underscored: true })
export class TimeGroupsLookupsModel extends LookupsModel {
  @Column
  startTime: string;

  @Column
  endTime: string;
}
