import { Table, Column, IsDate, ForeignKey, BelongsTo, DataType, Scopes } from 'sequelize-typescript';
import { BaseModel, BaseModelAttributes } from '../../../common/models/base.model';
import { AvailabilityModel } from '../../availability/models/availability.model';
import { AppointmentStatusLookupsModel } from '../../lookups/models/appointment-status.model';
import { AppointmentActionsLookupsModel } from '../../lookups/models/appointment-actions.model';
import { AppointmentTypesLookupsModel } from '../../lookups/models/appointment-types.model';
import { PatientsModel } from './patients.model';
import { Op } from 'sequelize';
import { AppointmentStatusEnum } from '../../../common/enums/appointment-status.enum';
import * as moment from 'moment';

export interface AppointmentsModelAttributes extends BaseModelAttributes {
  patientId: number;
  staffId: number;
  availabilityId?: number;
  previousAppointmentId?: number;
  appointmentTypeId?: number;
  date: string;
  endDate: Date;
  durationMinutes: number;
  startTime: string;
  provisionalDate: Date;
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
// TODO update scope to correctly connect patient and lookups
@Scopes(() => ({
  id: {
    attributes: {
      include: ['id'],
    },
  },
  getOne: {
    attributes: {
      exclude: ['deletedAt', 'deletedBy'],
    },
    where: {
      [`$status.code$`]: {
        [Op.ne]: AppointmentStatusEnum.CANCELED,
      },
      [`$patient.status_code$`]: {
        [Op.eq]: 'ACTIVE',
      },
      deletedBy: null,
    },
  },
  active: {
    attributes: {
      exclude: ['deletedAt', 'deletedBy'],
    },
    where: {
      [`$status.code$`]: {
        [Op.notIn]: [AppointmentStatusEnum.COMPLETE, AppointmentStatusEnum.CANCELED],
      },
      [`$patient.status_code$`]: {
        [Op.eq]: 'ACTIVE',
      },
      deletedBy: null,
    },
  },
}))
@Table({ tableName: 'Appointments', underscored: true })
export class AppointmentsModel
  extends BaseModel<AppointmentsModelAttributes, AppointmentsModelAttributes>
  implements AppointmentsModelAttributes {
  @Column
  @ForeignKey(() => PatientsModel)
  patientId: number;

  get doctorId(): number {
    return this.staffId;
  }

  @Column
  staffId: number;

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

  @Column(DataType.VIRTUAL)
  get startDate() {
    return moment(`${this.date} ${this.startTime}`, 'YYYY-MM-DD hh:mm:ss').toDate();
  }

  @IsDate
  @Column(DataType.DATE)
  provisionalDate: Date;

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
