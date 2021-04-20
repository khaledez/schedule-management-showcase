import { Table, Column, IsDate } from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base-model';

// note that the id will auto added by sequelize.
@Table({ tableName: 'new_patients_view', underscored: true })
export class PatientsModel extends BaseModel {
  @Column
  fullName: string;

  @IsDate
  @Column
  dob: Date;

  @Column
  primaryHealthPlanNumber: string;

  @Column
  statusCode: string;
}
