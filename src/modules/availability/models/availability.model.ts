import {
  Table,
  Column,
  HasOne,
  ForeignKey,
  BelongsTo,
  DefaultScope,
  IsDate,
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
}
