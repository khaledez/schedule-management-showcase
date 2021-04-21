import { Table, Column, IsDate, ForeignKey, BelongsTo, DefaultScope, DataType, Scopes } from 'sequelize-typescript';
import { BaseModel, BaseModelAttributes } from '../../../common/models/base.model';
import { AvailabilityModel } from '../../availability/models/availability.model';
import { AppointmentStatusLookupsModel } from '../../lookups/models/appointment-status.model';
import { AppointmentActionsLookupsModel } from '../../lookups/models/appointment-actions.model';
import { AppointmentTypesLookupsModel } from '../../lookups/models/appointment-types.model';
import { PatientsModel } from './patients.model';
import { Op } from 'sequelize';
import { AppointmentStatusEnum } from 'src/common/enums/appointment-status.enum';
import moment from 'moment';

export interface AppointmentsModelAttributes extends BaseModelAttributes {
  patientId: number;
  doctorId?: number;
  availabilityId?: number;
  previousAppointmentId?: number;
  appointmentTypeId?: number;
  date: string;
  endDate: Date;
  durationMinutes: number;
  startTime: string;
  provisionalDate: string;
  appointmentStatusId?: number;
  appointmentStatusNameEn?: string;
  appointmentStatusNameFr?: string;
  cancelRescheduleText?: string;
  cancelRescheduleReasonId?: number;
  cancelRescheduleReasonEn?: string;
  cancelRescheduleReasonFr?: string;
  upcomingAppointment?: boolean;
  canceledBy?: number;
  canceledAt?: Date;

  appointmentTypeNameEn?: string;
  appointmentTypeNameFr?: string;
  modeCode?: string;
}

// note that the id will auto added by sequelize.
@DefaultScope(() => ({
  attributes: {
    exclude: ['deletedAt', 'deletedBy'],
  },
  where: {
    [`$status.code$`]: {
      [Op.ne]: AppointmentStatusEnum.COMPLETE,
    },
    [`$patient.status_code$`]: {
      [Op.eq]: 'ACTIVE',
    },
  },
}))
@Scopes(() => ({
  id: {
    attributes: {
      include: ['id'],
    },
  },
  all: {},
}))
@Table({ tableName: 'Appointments', underscored: true })
export class AppointmentsModel
  extends BaseModel<AppointmentsModelAttributes, AppointmentsModelAttributes>
  implements AppointmentsModelAttributes {
  @Column
  @ForeignKey(() => PatientsModel)
  patientId: number;

  @Column({ field: 'staff_id' })
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
  set provisionalDate(value: string) {
    this.setDataValue('date', moment(value).format('YYYY-MM-DD'));
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

  @Column
  endDate: Date;
  @Column
  durationMinutes: number;
  @Column
  startTime: string;
  @Column
  appointmentStatusNameEn: string;
  @Column
  appointmentStatusNameFr: string;
  @Column
  cancelRescheduleReasonEn: string;
  @Column
  cancelRescheduleReasonFr: string;
  @Column
  appointmentTypeNameEn: string;
  @Column
  appointmentTypeNameFr: string;
  @Column
  modeCode: string;

  @BelongsTo(() => PatientsModel, 'patientId')
  patient: PatientsModel;

  @BelongsTo(() => AppointmentTypesLookupsModel, 'appointmentTypeId')
  type: AppointmentTypesLookupsModel;

  @BelongsTo(() => AppointmentStatusLookupsModel, 'appointmentStatusId')
  status: AppointmentStatusLookupsModel;

  @BelongsTo(() => AppointmentActionsLookupsModel, 'cancelRescheduleReasonId')
  cancelRescheduleReason: AppointmentActionsLookupsModel;
}
