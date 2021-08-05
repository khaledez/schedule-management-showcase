import { AppointmentsService, AssociationFieldsSortCriteria } from 'modules/appointments/appointments.service';
import { Order } from 'common/enums';
import { Key } from 'modules/appointments/dto/appointment-sort-dto';
import { AppointmentsModelAttributes } from 'modules/appointments/appointments.model';
import { IIdentity } from '@dashps/monmedx-common';

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

function createAppointment(
  identity: IIdentity,
  patientId: number,
  staffId: number,
  startDate: Date,
  endDate: Date,
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
  };
}
