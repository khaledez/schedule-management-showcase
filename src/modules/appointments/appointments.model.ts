import { AppointmentVisitModeLookupModel } from 'modules/lookups/models/appointment-visit-mode.model';
import { Op } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Scopes, Table } from 'sequelize-typescript';
import { AppointmentStatusEnum } from '../../common/enums/appointment-status.enum';
import { BaseModel, BaseModelAttributes } from '../../common/models/base.model';
import { AvailabilityModel } from '../availability/models/availability.model';
import { AppointmentActionsLookupsModel } from '../lookups/models/appointment-actions.model';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';
import { AppointmentTypesLookupsModel } from '../lookups/models/appointment-types.model';
import { PatientInfoModel } from '../patient-info/patient-info.model';

export interface AppointmentsModelAttributes extends BaseModelAttributes {
  patientId: number;
  staffId: number;
  availabilityId?: number;
  previousAppointmentId?: number;
  startDate: Date;
  endDate: Date;
  durationMinutes: number;
  provisionalDate?: Date;
  appointmentTypeId?: number;
  appointmentStatusId?: number;
  cancelRescheduleText?: string;
  cancelRescheduleReasonId?: number;
  upcomingAppointment?: boolean;
  canceledBy?: number;
  canceledAt?: Date;
  appointmentVisitModeId?: number;
  complaintsNotes?: string;
  visitId?: number;
  visitSummaryDocumentId?: string;
}

// note that the id will auto added by sequelize.
// TODO update scope to correctly connect patient and lookups
@Scopes(() => ({
  id: {
    attributes: {
      include: ['id'],
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
  @ForeignKey(() => PatientInfoModel)
  patientId: number;

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

  @Column(DataType.DATE)
  startDate: Date;

  @Column(DataType.DATE)
  endDate: Date;

  @Column
  durationMinutes: number;

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
  appointmentVisitModeId: number;

  @Column
  complaintsNotes: string;

  @Column
  visitId?: number;

  @Column
  visitSummaryDocumentId: string;

  @BelongsTo(() => PatientInfoModel, 'patientId')
  patient: PatientInfoModel;

  @BelongsTo(() => AppointmentTypesLookupsModel, 'appointmentTypeId')
  type: AppointmentTypesLookupsModel;

  @BelongsTo(() => AppointmentStatusLookupsModel, 'appointmentStatusId')
  status: AppointmentStatusLookupsModel;

  @BelongsTo(() => AppointmentActionsLookupsModel, 'cancelRescheduleReasonId')
  cancelRescheduleReason: AppointmentActionsLookupsModel;

  @BelongsTo(() => AppointmentVisitModeLookupModel, 'appointmentVisitModeId')
  visitMode: AppointmentVisitModeLookupModel;
}
