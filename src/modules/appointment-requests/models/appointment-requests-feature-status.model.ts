import { Column, DefaultScope, Table } from 'sequelize-typescript';
import { BaseModel, BaseModelAttributes } from '../../../common/models';

export interface AppointmentRequestFeatureStatusModelAttributes extends BaseModelAttributes {
  clinicId: number;
  doctorId?: number;
}

@DefaultScope(() => ({
  attributes: {
    exclude: ['deletedAt', 'deletedBy'],
  },
}))
@Table({ tableName: 'AppointmentRequestFeatureStatus', underscored: true })
export class AppointmentRequestFeatureStatusModel
  extends BaseModel<AppointmentRequestFeatureStatusModelAttributes>
  implements AppointmentRequestFeatureStatusModelAttributes {
  @Column
  clinicId: number;

  @Column
  doctorId: number;

  @Column
  enabled: boolean;
}
