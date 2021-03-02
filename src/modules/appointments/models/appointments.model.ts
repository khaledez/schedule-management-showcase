import {
  Table,
  Column,
  IsDate,
  ForeignKey,
  BelongsTo,
  DefaultScope,
  DataType,
  Scopes,
} from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base-model';
import { AvailabilityModel } from '../../availability/models/availability.model';
import { AppointmentStatusLookupsModel } from '../../lookups/models/appointment-status.model';
import { AppointmentActionsLookupsModel } from '../../lookups/models/appointment-actions.model';
import { AppointmentTypesLookupsModel } from '../../lookups/models/appointment-types.model';
import { PatientsModel } from './patients.model';
import * as moment from 'moment';
import { Op } from 'sequelize';
import { AppointmentStatusEnum } from 'src/common/enums/appointment-status.enum';

// note that the id will auto added by sequelize.
@DefaultScope(() => ({
  attributes: {
    exclude: ['deletedAt', 'deletedBy'],
  },
  where: {
    [`$status.code$`]: {
      [Op.ne]: AppointmentStatusEnum.COMPLETE,
    },
  },
}))
@Scopes(() => ({
  id: {
    attributes: {
      include: ['id'],
    },
  },
}))
@Table({ tableName: 'Appointments', underscored: true })
export class AppointmentsModel extends BaseModel {
  @Column
  @ForeignKey(() => PatientsModel)
  patientId: number;

  @Column
  doctorId: number;

  @Column
  @ForeignKey(() => AvailabilityModel)
  availabilityId: number;

  @Column
  previousAppointmentId: number;

  @Column
  @ForeignKey(() => AppointmentTypesLookupsModel)
  appointmentTypeId: number;

  @IsDate
  @Column
  get date(): string {
    return moment(this.getDataValue('date')).format('YYYY-MM-DD');
  }
  set date(value: string) {
    this.setDataValue('date', moment(value).format('YYYY-MM-DD'));
  }

  @IsDate
  @Column(DataType.DATE)
  get provisionalDate(): string {
    return moment(this.getDataValue('date')).format('YYYY-MM-DD');
  }

  @Column
  @ForeignKey(() => AppointmentStatusLookupsModel)
  appointmentStatusId: number;

  @Column
  cancelRescheduleText: string;

  @Column
  @ForeignKey(() => AppointmentActionsLookupsModel)
  cancelRescheduleReasonId: number;

  @BelongsTo(() => AvailabilityModel)
  availability: AvailabilityModel;

  @Column
  upcomingAppointment: boolean;

  @Column
  canceledBy: number;

  @Column
  canceledAt: Date;

  @BelongsTo(() => PatientsModel, 'patientId')
  patient: PatientsModel;

  @BelongsTo(() => AppointmentTypesLookupsModel, 'appointmentTypeId')
  type: AppointmentTypesLookupsModel;

  @BelongsTo(() => AppointmentStatusLookupsModel, 'appointmentStatusId')
  status: AppointmentStatusLookupsModel;

  @BelongsTo(() => AppointmentActionsLookupsModel, 'cancelRescheduleReasonId')
  cancelRescheduleReason: AppointmentActionsLookupsModel;
}
