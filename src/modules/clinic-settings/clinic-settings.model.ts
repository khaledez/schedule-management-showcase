import { Column, DataType, DefaultScope, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { BaseModel, BaseModelAttributes } from '../../common/models/base.model';

export interface clinicSettingsAttributes extends BaseModelAttributes {
  id: number;
  clinicId: number;
  staffId?: number;
  settings: any;
}

@DefaultScope(() => ({
  where: {
    deletedAt: null,
    deletedBy: null,
  },
  attributes: { exclude: ['deletedAt', 'deletedBy'] },
}))
@Table({ tableName: 'ClinicSettings', underscored: true, paranoid: true })
export class ClinicSettingsModel extends BaseModel<clinicSettingsAttributes> {
  @PrimaryKey
  @Column
  id: number;

  @Column
  clinicId: number;

  @Column
  staffId: number;

  @Column(DataType.JSON)
  settings: any;
}
