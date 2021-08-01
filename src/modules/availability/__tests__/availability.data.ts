import { CreateAvailabilityGroupBodyDto } from 'modules/availability/dto/create-availability-group-body.dto';
import { CreateAvailabilityDto } from 'modules/availability/dto/create.dto';
import { Op } from 'sequelize';
import { getTimeGroup, TimeGroupCode } from 'common/enums/time-group';
import { AvailabilityModelAttributes } from 'modules/availability/models/availability.interfaces';
import { CalendarType } from 'common/enums/calendar-type';
import { CalendarEntry } from 'common/interfaces/calendar-entry';

export function testCreateAvailabilityGroupInvalidAppointments(): {
  dto: CreateAvailabilityGroupBodyDto;
  message: string;
  ids: number[];
} {
  const dto: CreateAvailabilityGroupBodyDto = new CreateAvailabilityGroupBodyDto();
  dto.availabilityGroup = [
    buildCreateAvailabilityDto(1, '2034-05-25T07:43:40.084Z', 15, 4),
    buildCreateAvailabilityDto(1, '2034-05-25T07:43:40.084Z', 15, 1),
    buildCreateAvailabilityDto(1, '2034-05-25T07:43:40.084Z', 15, 5),
  ];
  return {
    dto,
    message: "The appointment types doesn't exist",
    ids: [4, 5],
  };
}

export function testCreateAvailabilityGroupSuccess(): {
  dto: CreateAvailabilityGroupBodyDto;
  result: Array<CreateAvailabilityDto>;
} {
  const dto: CreateAvailabilityGroupBodyDto = new CreateAvailabilityGroupBodyDto();
  dto.availabilityGroup = [
    buildCreateAvailabilityDto(1, '2034-05-25T07:43:40.084Z', 5, 1),
    buildCreateAvailabilityDto(2, '2034-06-25T07:43:40.084Z', 10, 2),
  ];
  return {
    dto,
    result: [
      {
        staffId: 1,
        startDate: '2034-05-25T07:43:40.084Z',
        durationMinutes: 5,
        appointmentTypeId: 1,
      },
      {
        staffId: 2,
        startDate: '2034-06-25T07:43:40.084Z',
        durationMinutes: 10,
        appointmentTypeId: 2,
      },
    ],
  };
}

export function getTransformDayTimeToSecondsTestCases() {
  return [
    { dayTime: '00:00:00', expected: 0 },
    { dayTime: '14:10:00', expected: 51_000 },
    { dayTime: '00:04:20', expected: 260 },
  ];
}

export function getExtractDayTimeInSecondsTestCases() {
  return [
    { date: '2021-10-25T00:00:00.084Z', expected: 0 },
    { date: '2021-10-25T14:10:00.084Z', expected: 51_000 },
    { date: '2021-10-25T00:04:20.084Z', expected: 260 },
  ];
}

export function getStaffIdWhereClauseTestCases() {
  return [
    { filter: { in: [1, 2, 3], or: null }, expected: { [Op.in]: [1, 2, 3] } },
    { filter: { eq: 1, or: null }, expected: { [Op.eq]: 1 } },
    { filter: { or: null }, expected: { [Op.notIn]: [] } },
  ];
}

export function getSuggestionsPriorityComparatorTestCases() {
  return [
    {
      timeGroup: getTimeGroup(TimeGroupCode.MORNING),
      suggestions: [
        buildSuggestionForComparatorTest(1, '2021-10-24T16:43:40.000Z'),
        buildSuggestionForComparatorTest(2, '2021-10-24T08:43:40.000Z'),
        buildSuggestionForComparatorTest(3, '2021-10-24T15:43:40.000Z'),
        buildSuggestionForComparatorTest(4, '2021-10-25T16:43:40.000Z'),
        buildSuggestionForComparatorTest(5, '2021-10-25T15:43:40.000Z'),
        buildSuggestionForComparatorTest(6, '2021-10-25T11:43:40.000Z'),
        buildSuggestionForComparatorTest(7, '2021-10-24T11:43:40.000Z'),
        buildSuggestionForComparatorTest(8, '2021-10-24T09:43:40.000Z'),
        buildSuggestionForComparatorTest(9, '2021-10-25T10:43:40.000Z'),
      ],
      expectedOrder: [2, 8, 9, 7, 3, 1, 6, 5, 4],
    },
    {
      timeGroup: getTimeGroup(TimeGroupCode.AFTERNOON),
      suggestions: [
        buildSuggestionForComparatorTest(1, '2021-10-24T16:43:40.000Z'),
        buildSuggestionForComparatorTest(2, '2021-10-24T08:43:40.000Z'),
        buildSuggestionForComparatorTest(3, '2021-10-24T15:43:40.000Z'),
        buildSuggestionForComparatorTest(4, '2021-10-25T16:43:40.000Z'),
        buildSuggestionForComparatorTest(5, '2021-10-25T15:43:40.000Z'),
        buildSuggestionForComparatorTest(6, '2021-10-25T11:43:40.000Z'),
        buildSuggestionForComparatorTest(7, '2021-10-24T11:43:40.000Z'),
        buildSuggestionForComparatorTest(8, '2021-10-24T09:43:40.000Z'),
        buildSuggestionForComparatorTest(9, '2021-10-25T10:43:40.000Z'),
      ],
      expectedOrder: [7, 6, 2, 8, 3, 1, 9, 5, 4],
    },
    {
      timeGroup: getTimeGroup(TimeGroupCode.EVENING),
      suggestions: [
        buildSuggestionForComparatorTest(1, '2021-10-24T16:43:40.000Z'),
        buildSuggestionForComparatorTest(2, '2021-10-24T08:43:40.000Z'),
        buildSuggestionForComparatorTest(3, '2021-10-24T15:43:40.000Z'),
        buildSuggestionForComparatorTest(4, '2021-10-25T16:43:40.000Z'),
        buildSuggestionForComparatorTest(5, '2021-10-25T15:43:40.000Z'),
        buildSuggestionForComparatorTest(6, '2021-10-25T11:43:40.000Z'),
        buildSuggestionForComparatorTest(7, '2021-10-24T11:43:40.000Z'),
        buildSuggestionForComparatorTest(8, '2021-10-24T09:43:40.000Z'),
        buildSuggestionForComparatorTest(9, '2021-10-25T10:43:40.000Z'),
      ],
      expectedOrder: [3, 1, 5, 4, 2, 8, 7, 9, 6],
    },
  ];
}

export function buildGetNineAvailabilitySuggestionsTestData() {
  return {
    getSuggestionsDto: {
      patientId: 1,
      staffId: {
        in: [1, 2],
        or: null,
      },
      appointmentTypeId: 1,
      referenceDate: '2031-10-24T08:30:00.000',
      timeGroup: TimeGroupCode.MORNING,
    },
    expectedDateOrder: [
      '2031-08-25T08:30:00.000Z',
      '2031-08-25T09:30:00.000Z',
      '2031-10-25T08:30:00.000Z',
      '2031-10-25T08:30:00.000Z',
      '2031-10-25T09:30:00.000Z',
      '2031-10-25T09:30:00.000Z',
      '2031-12-25T08:30:00.000Z',
      '2031-08-25T12:30:00.000Z',
      '2031-10-25T11:30:00.000Z',
    ],
  };
}

// A single availability belong to staff 9
export function buildGetOneAvailabilitySuggestionsTestData() {
  return {
    getSuggestionsDto: {
      patientId: 1,
      staffId: {
        eq: 9,
        or: null,
      },
      appointmentTypeId: 1,
      referenceDate: '2031-10-24T08:30:00.000',
      timeGroup: TimeGroupCode.EVENING,
    },
    expectedDateOrder: ['2031-10-25T08:30:00.000Z'],
  };
}

// Out of reference date proximity
export function buildGetZeroAvailabilitySuggestionsTestData() {
  return {
    getSuggestionsDto: {
      patientId: 1,
      staffId: {
        in: [1, 2, 9],
        or: null,
      },
      appointmentTypeId: 1,
      referenceDate: '2029-10-24T08:30:00.000',
      timeGroup: TimeGroupCode.EVENING,
    },
  };
}

export function getSuggestionsData() {
  return [
    buildCreateAvailabilityDto(9, '2031-10-25T08:30:00.000Z', 10, 1), // Won't find it because of staffId
    buildCreateAvailabilityDto(1, '2031-10-25T09:00:00.000Z', 10, 3), // Won't find it because of appointmentTypeId

    buildCreateAvailabilityDto(1, '2031-10-25T08:30:00.000Z', 10, 1), // 3
    buildCreateAvailabilityDto(1, '2031-10-25T09:30:00.000Z', 10, 1), // 5
    buildCreateAvailabilityDto(1, '2031-10-25T11:30:00.000Z', 10, 1), // 9

    buildCreateAvailabilityDto(2, '2031-10-25T08:30:00.000Z', 10, 1), // 4
    buildCreateAvailabilityDto(2, '2031-10-25T09:30:00.000Z', 10, 1), // 6
    buildCreateAvailabilityDto(2, '2031-10-25T12:30:00.000Z', 10, 1), // found 9 already

    buildCreateAvailabilityDto(1, '2031-08-25T08:30:00.000Z', 10, 1), // 1
    buildCreateAvailabilityDto(1, '2031-08-25T12:30:00.000Z', 10, 1), // 8
    buildCreateAvailabilityDto(2, '2031-08-25T09:30:00.000Z', 10, 1), // 2
    buildCreateAvailabilityDto(2, '2031-12-25T08:30:00.000Z', 10, 1), // 7

    buildCreateAvailabilityDto(1, '2032-10-25T09:00:00.000Z', 10, 1), // Won't find it, More than 90 days difference
    buildCreateAvailabilityDto(1, '2030-10-25T09:30:00.000Z', 10, 1), // Won't find it, More than 90 days difference
    buildCreateAvailabilityDto(2, '2032-10-25T09:30:00.000Z', 10, 1), // Won't find it, More than 90 days difference
    buildCreateAvailabilityDto(2, '2030-10-25T09:30:00.000Z', 10, 1), // Won't find it, More than 90 days difference
  ];
}

export function getToCalendarEntryTestData(): { input: AvailabilityModelAttributes; expectedOutput: CalendarEntry } {
  return {
    input: {
      id: 1,
      clinicId: 2,
      staffId: 3,
      startDate: new Date('2030-10-25T09:30:00.001Z'),
      endDate: new Date('2030-10-25T09:30:00.002Z'),
      durationMinutes: 4,
      appointmentTypeId: 1,
      startTime: '2030-10-25T09:30:00.003Z',
      createdBy: 5,
      createdAt: new Date('2030-10-25T09:30:00.004Z'),
      updatedBy: 6,
      updatedAt: new Date('2030-10-25T09:30:00.005Z'),
    },
    expectedOutput: {
      __typename: 'CalendarAvailability',
      id: 1,
      clinicId: 2,
      staffId: 3,
      startDate: new Date('2030-10-25T09:30:00.001Z'),
      endDate: new Date('2030-10-25T09:30:00.002Z'),
      durationMinutes: 4,
      entryType: CalendarType.AVAILABILITY,
      createdBy: 5,
      createdAt: new Date('2030-10-25T09:30:00.004Z'),
      updatedBy: 6,
      updatedAt: new Date('2030-10-25T09:30:00.005Z'),
    },
  };
}

function buildSuggestionForComparatorTest(staffId: number, date: string): AvailabilityModelAttributes {
  return {
    staffId: staffId,
    appointmentId: null,
    appointmentTypeId: null,
    startDate: new Date(date),
    startTime: null,
    endDate: null,
    durationMinutes: null,
  };
}

function buildCreateAvailabilityDto(
  staffId: number,
  startDate: string,
  durationMinutes: number,
  appointmentTypeId: number,
): CreateAvailabilityDto {
  return {
    staffId,
    startDate,
    durationMinutes,
    appointmentTypeId,
  };
}
