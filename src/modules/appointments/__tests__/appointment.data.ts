import { IConfirmCompleteVisitEvent, IIdentity } from '@monmedx/monmedx-common';
import { AppointmentActionEnum, Order } from 'common/enums';
import { AppointmentsModelAttributes } from 'modules/appointments/appointments.model';
import { AppointmentsService, AssociationFieldsSortCriteria } from 'modules/appointments/appointments.service';
import { Key } from 'modules/appointments/dto/appointment-sort-dto';
import { PatientInfoAttributes } from '../../patient-info/patient-info.model';

export function getReleasePatientInfoAfterCompleteVisit() {
  return {
    id: 10,
    clinicId: 11,
    fullName: 'Release patient after complete visit',
    primaryHealthPlanNumber: 'AAB12',
    dob: '2021-10-25',
    statusCode: 'ACTIVE',
  };
}

export function getProvisionalPatientInfoAfterCompleteVisit() {
  return {
    id: 21,
    clinicId: 22,
    fullName: 'Create provisional for patient after complete visit',
    primaryHealthPlanNumber: 'AAB12',
    dob: '2021-10-25',
    statusCode: 'ACTIVE',
  };
}

export function buildIConfirmCompleteVisitEvent(
  patientInfo: PatientInfoAttributes,
  appointment: AppointmentsModelAttributes,
  upcomingAppointment: AppointmentsModelAttributes,
  release: boolean,
): IConfirmCompleteVisitEvent {
  return {
    eventName: 'visit_complete',
    userId: patientInfo.id,
    source: 'visit-management',
    patientId: patientInfo.id,
    clinicId: patientInfo.clinicId,
    staffId: 103,
    langCode: 'EN',
    data: {
      patient: {
        id: patientInfo.id,
        release: release,
        displayName: patientInfo.fullName,
      },
      visit: {
        id: 1,
        documentId: 'asd',
        appointment: {
          id: appointment.id,
          typeId: appointment.appointmentTypeId,
          startDate: appointment.startDate,
          actualStartDate: appointment.startDate.toISOString(),
          modeCode: 'IN-PERSON',
          amended: false,
          completedBy: 103,
          completedAt: appointment.endDate,
        },
      },
      requisition: {},
      billing: {
        services: [],
      },
      upcomingAppointment: {
        id: upcomingAppointment.id,
        typeId: upcomingAppointment.appointmentTypeId,
        date: upcomingAppointment.startDate.toISOString(),
        release: release,
      },
    },
  };
}

export function buildICompleteVisitEventKeepOriginalAppointment(
  patientInfo: PatientInfoAttributes,
  appointment: AppointmentsModelAttributes,
  release: boolean,
): IConfirmCompleteVisitEvent {
  return {
    eventName: 'visit_complete',
    userId: patientInfo.id,
    source: 'visit-management',
    patientId: patientInfo.id,
    clinicId: patientInfo.clinicId,
    staffId: 103,
    langCode: 'EN',
    data: {
      patient: {
        id: patientInfo.id,
        release: release,
        displayName: patientInfo.fullName,
      },
      visit: {
        id: 1,
        documentId: 'asd',
        appointment: {
          id: appointment.id,
          typeId: appointment.appointmentTypeId,
          startDate: appointment.startDate,
          actualStartDate: appointment.startDate.toISOString(),
          modeCode: 'IN-PERSON',
          amended: false,
          completedBy: 103,
          completedAt: appointment.endDate,
        },
      },
      requisition: {},
      billing: {
        services: [],
      },
      upcomingAppointment: {
        id: null,
        typeId: null,
        date: null,
        release: release,
      },
    },
  };
}

export function getQueryGenericSortMapperTestCases() {
  const associationFields: AssociationFieldsSortCriteria = {
    STATUS: {
      relation: 'status',
      column: 'code',
    },
    DATE: {
      column: AppointmentsService.DATE_COLUMN,
    },
  };
  return [
    {
      sortDtos: null,
      associationFields: associationFields,
      expectedOrder: [
        [AppointmentsService.DATE_COLUMN, Order.DESC],
        [Key.ID, Order.DESC],
      ],
    },
    {
      sortDtos: [],
      associationFields: associationFields,
      expectedOrder: [
        [AppointmentsService.DATE_COLUMN, Order.DESC],
        [Key.ID, Order.DESC],
      ],
    },
    {
      sortDtos: [
        { key: Key.DATE, order: Order.ASC },
        { key: Key.STATUS, order: Order.ASC },
        { key: Key.ID, order: Order.DESC },
      ],
      associationFields: associationFields,
      expectedOrder: [
        [AppointmentsService.DATE_COLUMN, Order.ASC],
        [associationFields[Key.STATUS].relation, associationFields[Key.STATUS].column, Order.ASC],
        [Key.ID, Order.DESC],
      ],
    },
  ];
}

export function getPatientHistoryTestCases() {
  return [
    {
      pagingFilter: null,
      payload: {
        patientId: 55,
      },
      expectedResult: {
        count: 0,
        datesOrder: [],
      },
    },
    {
      pagingFilter: null,
      payload: {
        patientId: 67,
        sort: [
          {
            key: 'DATE',
            order: 'ASC',
          },
        ],
      },
      expectedResult: {
        count: 4,
        datesOrder: [
          '2032-05-25T08:00:00.000Z',
          '2032-05-26T08:00:00.000Z',
          '2032-05-27T08:00:00.000Z',
          '2032-05-28T08:00:00.000Z',
        ],
      },
    },
    {
      pagingFilter: null,
      payload: {
        patientId: 67,
        sort: [
          {
            key: 'DATE',
            order: 'DESC',
          },
        ],
      },
      expectedResult: {
        count: 4,
        datesOrder: [
          '2032-05-28T08:00:00.000Z',
          '2032-05-27T08:00:00.000Z',
          '2032-05-26T08:00:00.000Z',
          '2032-05-25T08:00:00.000Z',
        ],
      },
    },
    {
      pagingFilter: {
        limit: 1,
        offset: 1,
      },
      payload: {
        patientId: 71,
        sort: [
          {
            key: 'DATE',
            order: 'ASC',
          },
        ],
      },
      expectedResult: {
        count: 3,
        datesOrder: ['2032-05-26T08:00:00.000Z'],
      },
    },
  ];
}

export function getPatientHistoryTestData(identity: IIdentity): AppointmentsModelAttributes[] {
  return [
    createAppointment(identity, 67, 1, new Date('2032-05-25T08:00:00.000Z'), new Date('2032-05-25T08:30:00.000Z')),
    createAppointment(identity, 67, 1, new Date('2032-05-26T08:00:00.000Z'), new Date('2032-05-25T08:30:00.000Z')),
    createAppointment(identity, 67, 1, new Date('2032-05-27T08:00:00.000Z'), new Date('2032-05-25T08:30:00.000Z')),
    createAppointment(identity, 67, 1, new Date('2032-05-28T08:00:00.000Z'), new Date('2032-05-25T08:30:00.000Z')),
    createAppointment(identity, 71, 1, new Date('2032-05-25T08:00:00.000Z'), new Date('2032-05-25T08:30:00.000Z')),
    createAppointment(identity, 71, 1, new Date('2032-05-26T08:00:00.000Z'), new Date('2032-05-25T08:30:00.000Z')),
    createAppointment(identity, 71, 1, new Date('2032-05-27T08:00:00.000Z'), new Date('2032-05-25T08:30:00.000Z')),
  ];
}

export function getPatientAppointmentsTestData(identity: IIdentity): AppointmentsModelAttributes[] {
  return [
    createAppointment(
      // 0
      identity,
      143,
      1,
      new Date('2032-05-25T08:00:00.000Z'),
      new Date('2032-05-25T08:30:00.000Z'),
      true,
    ),
    createAppointment(
      // 1
      identity,
      143,
      1,
      new Date('2032-05-26T08:00:00.000Z'),
      new Date('2032-05-25T08:30:00.000Z'),
      false,
    ),
    createAppointment(
      // 2
      identity,
      143,
      1,
      new Date('2032-05-27T08:00:00.000Z'),
      new Date('2032-05-25T08:30:00.000Z'),
      false,
    ),
    createAppointment(
      // 3
      identity,
      170,
      1,
      new Date('2032-05-25T08:00:00.000Z'),
      new Date('2032-05-25T08:30:00.000Z'),
      false,
    ),
    createAppointment(
      // 4
      identity,
      170,
      1,
      new Date('2032-05-26T08:00:00.000Z'),
      new Date('2032-05-25T08:30:00.000Z'),
      false,
    ),
    createAppointment(
      // 5
      identity,
      170,
      1,
      new Date('2032-05-27T08:00:00.000Z'),
      new Date('2032-05-25T08:30:00.000Z'),
      true,
    ),
    createAppointment(
      // 6
      identity,
      197,
      1,
      new Date('2012-05-25T08:00:00.000Z'),
      new Date('2012-05-25T08:30:00.000Z'),
      true,
    ),
    createAppointment(
      // 7
      identity,
      197,
      1,
      new Date('2032-05-26T08:00:00.000Z'),
      new Date('2032-05-25T08:30:00.000Z'),
      false,
    ),
  ];
}

export function getAppointmentByPatientIdTestCases() {
  return [
    {
      patientId: 143,
      date: new Date('2032-05-25T08:00:00.000Z'),
    },
    {
      patientId: 197,
      date: new Date('2012-05-25T08:00:00.000Z'),
    },
    {
      patientId: 230,
      date: undefined,
    },
  ];
}

export function getAppointmentWithActionsTestCases() {
  return [
    {
      statusId: 1, //WAIT_LIST
      Primary: [AppointmentActionEnum.SCHEDULE],
      Secondary: [AppointmentActionEnum.CHANGE_APPT_TYPE],
    },
    {
      statusId: 2, //SCHEDULE
      Primary: [AppointmentActionEnum.CONFIRM1],
      Secondary: [
        AppointmentActionEnum.CONFIRM2,
        AppointmentActionEnum.CHECK_IN,
        AppointmentActionEnum.READY,
        AppointmentActionEnum.RESCHEDULE_APPT,
        AppointmentActionEnum.CANCEL,
        AppointmentActionEnum.CHANGE_APPT_TYPE,
      ],
    },
    {
      statusId: 3, //CONFIRM1
      Primary: [AppointmentActionEnum.CONFIRM2],
      Secondary: [
        AppointmentActionEnum.CHECK_IN,
        AppointmentActionEnum.READY,
        AppointmentActionEnum.RESCHEDULE_APPT,
        AppointmentActionEnum.CANCEL,
        AppointmentActionEnum.CHANGE_APPT_TYPE,
      ],
    },
    {
      statusId: 4, //CHECK_IN
      Primary: [AppointmentActionEnum.READY],
      Secondary: [
        AppointmentActionEnum.RESCHEDULE_APPT,
        AppointmentActionEnum.CANCEL,
        AppointmentActionEnum.CHANGE_APPT_TYPE,
      ],
    },
    {
      statusId: 8, //CONFIRM2
      Primary: [AppointmentActionEnum.CHECK_IN],
      Secondary: [
        AppointmentActionEnum.READY,
        AppointmentActionEnum.RESCHEDULE_APPT,
        AppointmentActionEnum.CANCEL,
        AppointmentActionEnum.CHANGE_APPT_TYPE,
      ],
    },
    {
      statusId: 5, //READY
      Primary: [AppointmentActionEnum.V_PENDING],
      Secondary: [
        AppointmentActionEnum.RESCHEDULE_APPT,
        AppointmentActionEnum.CANCEL,
        AppointmentActionEnum.CHANGE_APPT_TYPE,
      ],
    },
    {
      statusId: 6, //COMPLETE
      Primary: [],
      Secondary: [],
    },
    {
      statusId: 7, //CANCELED
      Primary: [],
      Secondary: [],
    },
    {
      statusId: 9, //VISIT
      Primary: [AppointmentActionEnum.IN_PROGRESS],
      Secondary: [],
    },
    {
      statusId: 10, //RELEASED
      Primary: [AppointmentActionEnum.REACTIVATE],
      Secondary: [],
    },
    {
      statusId: 11, //RESCHEDULED
      Primary: [],
      Secondary: [],
    },
  ];
}

export function createAppointment(
  identity: IIdentity,
  patientId: number,
  staffId: number,
  startDate: Date,
  endDate: Date,
  upcomingAppointment?: boolean,
): AppointmentsModelAttributes {
  return {
    durationMinutes: 30,
    appointmentTypeId: 1,
    appointmentStatusId: 1,
    provisionalDate: new Date('2042-05-25T08:00:00.000Z'),
    clinicId: identity.clinicId,
    createdBy: identity.userId,
    patientId,
    staffId,
    startDate,
    endDate,
    upcomingAppointment,
  };
}
