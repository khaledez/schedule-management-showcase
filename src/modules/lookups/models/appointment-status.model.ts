import { Table, Column } from 'sequelize-typescript';
import { LookupsModel } from '../../../common/models/lookup-model';

@Table({ tableName: 'AppointmentStatusLookups', underscored: true })
export class AppointmentStatusLookupsModel extends LookupsModel {
  @Column
  code: string;
}
