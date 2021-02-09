import { Table, Column, DefaultScope } from 'sequelize-typescript';
import { LookupsModel } from '../../../common/models/lookup-model';

@DefaultScope(() => ({
  attributes: {
    include: ['id', 'clinicId', 'nameEn', 'nameFr', 'value'],
  },
}))
@Table({ tableName: 'DurationMinutesLookups', underscored: true })
export class DurationMinutesLookupsModel extends LookupsModel {
  @Column
  value: number;
}
