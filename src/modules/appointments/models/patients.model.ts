import { Table, Column, IsDate, HasOne } from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base-model';
import { IsBoolean } from 'class-validator';

// note that the id will auto added by sequelize.
@Table({ tableName: 'patients_view', underscored: true })
export class PatientsModel extends BaseModel {
  @Column
  clinicId: number;

  @Column
  fullName: string;

  @IsDate
  @Column
  dob: Date;

  @Column
  primary: boolean;

  @Column
  phoneTypeCode: string;

  @Column
  phoneNumber: string;

  @Column
  primaryHealthPlanNumber: string;
}
