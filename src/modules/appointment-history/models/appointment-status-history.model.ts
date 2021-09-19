import { BelongsTo, Column, DefaultScope, ForeignKey, Table } from 'sequelize-typescript';
import { BaseModel, BaseModelAttributes } from '../../../common/models';
import { AppointmentsModel } from '../../appointments/appointments.model';
import { AppointmentStatusLookupsModel } from '../../lookups/models/appointment-status.model';

export interface AppointmentStatusHistoryAttributes extends BaseModelAttributes {
  appointmentId: number;
  appointmentStatusId: number;
  previousAppointmentStatusId?: number;
}

@DefaultScope(() => ({
  where: {
    deletedAt: null,
    deletedBy: null,
  },
  attributes: { exclude: ['deletedAt', 'deletedBy'] },
}))
@Table({ tableName: 'AppointmentStatusHistory', underscored: true })
export class AppointmentStatusHistoryModel
  extends BaseModel<AppointmentStatusHistoryAttributes, AppointmentStatusHistoryAttributes>
  implements AppointmentStatusHistoryAttributes {
  @Column
  @ForeignKey(() => AppointmentsModel)
  appointmentId: number;

  @Column
  @ForeignKey(() => AppointmentStatusLookupsModel)
  appointmentStatusId: number;

  @Column
  @ForeignKey(() => AppointmentStatusLookupsModel)
  previousAppointmentStatusId?: number;

  @BelongsTo(() => AppointmentsModel)
  appointment: AppointmentsModel;

  @BelongsTo(() => AppointmentStatusLookupsModel, 'appointmentStatusId')
  status: AppointmentStatusLookupsModel;

  @BelongsTo(() => AppointmentStatusLookupsModel, 'previousAppointmentStatusId')
  previousStatus: AppointmentStatusLookupsModel;
}
