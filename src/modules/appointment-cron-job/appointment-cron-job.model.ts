import { BelongsTo, Column, DataType, DefaultScope, ForeignKey, Table } from 'sequelize-typescript';
import { BaseModel, BaseModelAttributes } from '../../common/models/base.model';
import { AppointmentsModel } from '../appointments/appointments.model';

export interface AppointmentCronJobAttributes extends BaseModelAttributes {
  clinicId?: number;
  appointmentId: number;
  type: string;
  targetDate: Date;
  sentDate?: Date;
  metaData?: any;
}

// note that the id will auto added by sequelize.
@DefaultScope(() => ({
  where: {
    deletedAt: null,
    deletedBy: null,
  },
  attributes: { exclude: ['deletedAt', 'deletedBy'] },
}))
@Table({ tableName: 'AppointmentCronJob', underscored: true, paranoid: true })
export class AppointmentCronJobModel extends BaseModel<AppointmentCronJobAttributes> {
  @Column
  clinicId: number;

  @Column
  @ForeignKey(() => AppointmentsModel)
  appointmentId: number;

  @Column
  type: string;

  @Column(DataType.DATE)
  targetDate: Date;

  @Column(DataType.DATE)
  sentDate: Date;

  @Column(DataType.JSON)
  metaData: any;

  @BelongsTo(() => AppointmentsModel, 'appointmentId')
  appointment?: AppointmentsModel;
}
