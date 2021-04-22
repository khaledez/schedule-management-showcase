import { Table, Column, IsDate } from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base.model';

export interface PatientsModelAttributes {
  fullName: string;
  dob: Date;
  primaryHealthPlanNumber: string;
  statusCode: string;
}

// note that the id will auto added by sequelize.
@Table({ tableName: 'new_patients_view', underscored: true })
export class PatientsModel extends BaseModel<PatientsModelAttributes> implements PatientsModelAttributes {
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
