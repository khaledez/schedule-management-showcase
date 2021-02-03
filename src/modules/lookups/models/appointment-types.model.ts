import { Table, Column } from 'sequelize-typescript';
import { LookupsModel } from '../../../common/models/lookup-model';

@Table({ tableName: 'AppointmentTypesLookups', underscored: true })
export class AppointmentTypesLookupsModel extends LookupsModel {
  @Column
  code: string;
}
