import { Table, Column } from 'sequelize-typescript';
import { LookupsModel } from '../../../common/models/lookup-model';

@Table({ tableName: 'AppointmentActionsLookups', underscored: true })
export class AppointmentActionsLookupsModel extends LookupsModel {
  @Column
  code: string;
}
