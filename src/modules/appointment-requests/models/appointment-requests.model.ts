import { BelongsTo, Column, DefaultScope, ForeignKey, IsDate, Scopes, Table } from 'sequelize-typescript';
import { AppointmentTypesLookupsModel } from '../../lookups/models/appointment-types.model';
import { AppointmentsModel, AppointmentsModelAttributes } from '../../appointments/appointments.model';
import { BaseModel, BaseModelAttributes } from '../../../common/models';
import { TimeGroupsLookupsModel } from '../../lookups/models/time-groups.model';
import { AppointmentVisitModeLookupModel } from '../../lookups/models/appointment-visit-mode.model';
import { AppointmentRequestTypesLookupsModel } from '../../lookups/models/appointment-request-types.model';
import { AppointmentRequestStatusLookupsModel } from '../../lookups/models/appointment-request-status.model';
import { CalendarEntry } from '../../../common/interfaces/calendar-entry';
import { LookupWithCodeAttributes } from '../../lookups/models';

export interface AppointmentsRequestModelAttributes extends BaseModelAttributes {
  clinicId: number;
  userId: number;
  patientId: number;
  doctorId?: number;
  appointmentTypeId?: number;
  timeGroupId?: number;
  appointmentVisitModeId?: number;
  requestStatusId?: number;
  requestTypeId?: number;
  originalAppointmentId?: number;
  fullfillmentAppointmentId?: number;
  date?: Date;
  time?: Date;
  complaints?: string;
  requestReason?: string;
  rejectionReason?: string;
}

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
        as: 'requestType',
      },
      {
        model: AppointmentRequestStatusLookupsModel,
        as: 'requestStatus',
      },
      {
        model: AppointmentsModel,
        as: 'originalAppointment',
      },
      {
        model: AppointmentVisitModeLookupModel,
        as: 'visitMode',
      },
      {
        model: TimeGroupsLookupsModel,
        as: 'timeGroup',
      },
    ],
  },
}))
@Table({ tableName: 'AppointmentRequests', underscored: true })
export class AppointmentRequestsModel
  extends BaseModel<AppointmentsRequestModelAttributes>
  implements AppointmentsRequestModelAttributes {
  @Column
  clinicId: number;

  @Column
  userId: number;

  @Column
  patientId: number;

  @Column
  doctorId: number;

  @Column
  @ForeignKey(() => AppointmentTypesLookupsModel)
  appointmentTypeId: number;

  @Column
  @ForeignKey(() => TimeGroupsLookupsModel)
  timeGroupId: number;

  @Column
  @ForeignKey(() => AppointmentVisitModeLookupModel)
  appointmentVisitModeId: number;

  @Column
  @ForeignKey(() => AppointmentRequestStatusLookupsModel)
  requestStatusId: number;

  @Column
  @ForeignKey(() => AppointmentRequestTypesLookupsModel)
  requestTypeId: number;

  @Column
  @ForeignKey(() => AppointmentsModel)
  originalAppointmentId: number;

  @Column
  @ForeignKey(() => AppointmentsModel)
  fullfillmentAppointmentId: number;

  @IsDate
  @Column
  date: Date;

  @Column
  time: Date;

  @Column
  complaints: string;

  @Column
  requestReason: string;

  @Column
  rejectionReason: string;

  @BelongsTo(() => AppointmentsModel, 'originalAppointmentId')
  originalAppointment?: AppointmentsModel;

  @BelongsTo(() => AppointmentsModel, 'fullfillmentAppointmentId')
  fullfillmentAppointment?: AppointmentsModel;

  @BelongsTo(() => AppointmentVisitModeLookupModel, 'appointmentVisitModeId')
  visitMode: AppointmentVisitModeLookupModel;

  @BelongsTo(() => AppointmentRequestTypesLookupsModel, 'requestTypeId')
  requestType: AppointmentRequestTypesLookupsModel;

  @BelongsTo(() => AppointmentRequestStatusLookupsModel, 'requestStatusId')
  requestStatus: AppointmentRequestStatusLookupsModel;

  @BelongsTo(() => TimeGroupsLookupsModel, 'timeGroupId')
  timeGroup: TimeGroupsLookupsModel;
}
