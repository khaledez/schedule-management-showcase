import { Table, Column, IsDate, HasOne } from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base-model';

// note that the id will auto added by sequelize.
@Table({ tableName: 'patients_view', underscored: true })
export class PatientsModel extends BaseModel {
  @Column
  firstName: string;

  @Column
  lastName: string;

  @IsDate
  @Column
  dob: Date;
}
