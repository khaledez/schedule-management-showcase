import { InternalServerErrorException, Logger } from '@nestjs/common';
import { CalendarType, ErrorCodes } from 'common/enums';
import { CalendarEntry } from 'common/interfaces/calendar-entry';
import { LookupWithCodeAttributes } from 'modules/lookups/models';
import { AppointmentCancelRescheduleReasonLookupModel } from 'modules/lookups/models/appointment-cancel-reschedule-reason.model';
import { AppointmentVisitModeLookupModel } from 'modules/lookups/models/appointment-visit-mode.model';
import { nanoid } from 'nanoid';
import {
  AfterCreate,
  AfterUpdate,
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
  Table,
} from 'sequelize-typescript';
import { BaseModel } from '../../common/models';
import { AppointmentStatusHistoryModel } from '../appointment-history/models/appointment-status-history.model';
import { AppointmentRequestsModel } from '../appointment-requests/models';
import { AvailabilityModel } from '../availability/models/availability.model';
import { AppointmentActionsLookupsModel } from '../lookups/models/appointment-actions.model';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';
import { AppointmentTypesLookupsModel } from '../lookups/models/appointment-types.model';
import { PatientInfoModel } from '../patient-info/patient-info.model';
import { AppointmentsDefaultScope } from './scopes/appointments-default-scope';
import { AppointmentsRoleScope } from './scopes/appointments-role-scope';

const { INTEGER, VIRTUAL } = DataType;

export interface AppointmentsModelAttributes extends CalendarEntry {
  patientId: number;
  availabilityId?: number;
  previousAppointmentId?: number;
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
  appointmentRequestId?: number;
  appointmentRequestDate?: Date;
  appointmentToken?: string;
  keptAvailabilityOnCancel?: boolean;

  type?: AppointmentTypesLookupsModel;
  availability?: AvailabilityModel;
  visitMode?: AppointmentVisitModeLookupModel;
  status?: AppointmentStatusLookupsModel;
  cancelRescheduleReason?: AppointmentCancelRescheduleReasonLookupModel;
  primaryAction?: LookupWithCodeAttributes;
  secondaryActions?: LookupWithCodeAttributes[];
  provisionalAppointment?: boolean;
}

// note that the id will auto added by sequelize.
@DefaultScope(AppointmentsDefaultScope)
@Scopes(() => ({
  roleScope: AppointmentsRoleScope,
}))
@Table({ tableName: 'Appointments', underscored: true })
export class AppointmentsModel
  extends BaseModel<AppointmentsModelAttributes, AppointmentsModelAttributes>
  implements AppointmentsModelAttributes
{
  private static readonly logger = new Logger(AppointmentsModel.name);

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

  /**
   * when creating an adhoc appointment this field represents the actual time.
   * when completing an appointment and this field is empty,
   * it will be populated with the same value as startDate
   */
  @Column(DataType.DATE)
  actualStartDate: Date;

  @Column(DataType.DATE)
  actualEndDate: Date;

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

  @BelongsTo(() => AvailabilityModel, 'availabilityId')
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
  appointmentRequestId?: number;

  @Column
  appointmentRequestDate?: Date;

  @Column
  visitSummaryDocumentId: string;

  @Column
  keptAvailabilityOnCancel: boolean;

  @Column({
    defaultValue: () => nanoid(),
    type: DataType.STRING(255),
  })
  appointmentToken: string;

  @BelongsTo(() => PatientInfoModel, 'patientId')
  patient: PatientInfoModel;

  @BelongsTo(() => AppointmentTypesLookupsModel, 'appointmentTypeId')
  type: AppointmentTypesLookupsModel;

  @BelongsTo(() => AppointmentStatusLookupsModel, 'appointmentStatusId')
  status: AppointmentStatusLookupsModel;

  @BelongsTo(() => AppointmentCancelRescheduleReasonLookupModel, 'cancelRescheduleReasonId')
  cancelRescheduleReason: AppointmentCancelRescheduleReasonLookupModel;

  @BelongsTo(() => AppointmentVisitModeLookupModel, 'appointmentVisitModeId')
  visitMode: AppointmentVisitModeLookupModel;

  @BelongsTo(() => AppointmentRequestsModel, 'appointmentRequestId')
  appointmentRequest: AppointmentRequestsModel;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      return 'CalendarAppointment';
    },
  })
  __typename: string;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      return CalendarType.APPOINTMENT;
    },
  })
  entryType: CalendarType;

  @Column(VIRTUAL(INTEGER))
  get hasPendingAppointmentRequest() {
    return !!this.appointmentRequestId;
  }

  @AfterCreate
  static addStatusToHistoryAfterCreate(instance: AppointmentsModel) {
    AppointmentStatusHistoryModel.create({
      appointmentId: instance.id,
      clinicId: instance.clinicId,
      appointmentStatusId: instance.appointmentStatusId,
      createdBy: instance.createdBy,
      createdAt: instance.createdAt,
    }).catch((error) => {
      const message = `Failed to add status ${instance.appointmentStatusId} change to appointment ${instance.id} history`;
      AppointmentsModel.logger.error(`${message}: ${error.message}`);
      throw new InternalServerErrorException({
        fields: [],
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: message,
      });
    });
  }

  @AfterUpdate
  static async addStatusToHistoryAfterUpdate(updatedAppointment) {
    if (!updatedAppointment.changed() || !updatedAppointment.changed().includes('appointmentStatusId')) {
      return;
    }
    await AppointmentStatusHistoryModel.create({
      appointmentId: updatedAppointment.id,
      clinicId: updatedAppointment.clinicId,
      appointmentStatusId: updatedAppointment.appointmentStatusId,
      previousAppointmentStatusId: updatedAppointment._previousDataValues.appointmentStatusId,
      createdBy: updatedAppointment.updatedBy,
      createdAt: updatedAppointment.updatedAt,
    }).catch((error) => {
      const message = `Failed to add status ${updatedAppointment.appointmentStatusId} change to appointment ${updatedAppointment.id} history`;
      AppointmentsModel.logger.error(`${message}: ${error.message}`);
      throw new InternalServerErrorException({
        fields: [],
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: message,
      });
    });
  }
}
