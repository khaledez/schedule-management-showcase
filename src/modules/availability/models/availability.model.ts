import {
  Table,
  Column,
  HasOne,
  ForeignKey,
  BelongsTo,
  DefaultScope,
  IsDate,
  DataType,
  Scopes,
} from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base-model';
import { AppointmentsModel } from '../../appointments/models/appointments.model';
import { AppointmentTypesLookupsModel } from '../../lookups/models/appointment-types.model';
import * as moment from 'moment';
@DefaultScope(() => ({
  attributes: {
    exclude: ['deletedAt', 'deletedBy'],
  },
}))
@Scopes(() => ({
  full: {
    exclude: ['deletedAt', 'deletedBy'],
    include: [
      {
        model: AppointmentTypesLookupsModel,
        as: 'type',
      },
    ],
  },
}))
@Table({ tableName: 'Availability', underscored: true })
export class AvailabilityModel extends BaseModel {
  @Column
  doctorId: number;

  @Column
  @ForeignKey(() => AppointmentsModel)
  appointmentId: number;

  @Column
  startTime: string;

  @Column
  @ForeignKey(() => AppointmentTypesLookupsModel)
  appointmentTypeId: number;

  @IsDate
  @Column
  get date(): string {
    return moment(this.getDataValue('date')).format('YYYY-MM-DD');
  }

  @Column
  durationMinutes: number;

  @HasOne(() => AppointmentsModel)
  appointment: AppointmentsModel;

  @BelongsTo(() => AppointmentTypesLookupsModel, 'appointmentTypeId')
  type: AppointmentTypesLookupsModel;

  @Column(DataType.VIRTUAL(DataType.STRING))
  get endTime(): string {
    return moment(this.startTime, 'hh:mm:ss').add(this.durationMinutes, 'minutes').format('hh:mm:ss');
  }
}
