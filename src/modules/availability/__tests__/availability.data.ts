import { CalendarType } from 'common/enums/calendar-type';
import { getTimeGroup, TimeGroupCode } from 'common/enums/time-group';
import { CalendarEntry } from 'common/interfaces/calendar-entry';
import { CreateAvailabilityDto } from 'modules/availability/dto/create.dto';
import { AvailabilityModelAttributes } from 'modules/availability/models/availability.interfaces';
import { Op } from 'sequelize';
import { UpdateAvailabilityDto } from 'modules/availability/dto/update.dto';
import { BulkUpdateAvailabilityDto } from 'modules/availability/dto/add-or-update-availability-body.dto';

export function getEntityIdWhereClauseTestCases() {
  return [
    { filter: { in: [1, 2, 3], or: null }, expected: { [Op.in]: [1, 2, 3] } },
    { filter: { eq: 1, or: null }, expected: { [Op.eq]: 1 } },
    { filter: { or: null }, expected: { [Op.notIn]: [] } },
  ];
}

export function getAvailabilitySearchDateWhereClauseTestCases() {
  const dateA = new Date('2021-10-24T00:00:00.000Z');
  const dateB = new Date('2021-10-25T00:00:00.000Z');
  return [
    { filter: { eq: dateA }, expected: { [Op.between]: [dateA, new Date('2021-10-24T23:59:59.999Z')] } },
    { filter: { between: [dateA, dateB] }, expected: { [Op.between]: [dateA, new Date('2021-10-25T23:59:59.999Z')] } },
    { filter: {}, expected: { [Op.notIn]: [] } },
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

export function getSearchForAvailabilitiesTestCases() {
  return [
    {
      filter: {
        dateRange: {
          between: [new Date('2030-10-25T09:30:00.000Z'), new Date('2031-12-25T09:30:00.000Z')],
        },
        staffId: {
          eq: 1,
          or: null,
        },
        appointmentTypeId: {
          eq: 1,
          or: null,
        },
        timeGroup: 'MORNING',
      },
      expectedResult: {
        availabilitiesCount: 4,
        dates: [
          '2030-10-25T09:30:00.000Z',
          '2031-08-25T08:30:00.000Z',
          '2031-10-25T08:30:00.000Z',
          '2031-10-25T09:30:00.000Z',
        ],
      },
    },
    {
      filter: {
        dateRange: {
          between: [new Date('2030-10-25T09:30:00.000Z'), new Date('2031-12-25T09:30:00.000Z')],
        },
        staffId: {
          eq: 6,
          or: null,
        },
      },
      expectedResult: {
        availabilitiesCount: 0,
        dates: [],
      },
    },
  ];
}

export function getAvailabilitiesCountTestCases() {
  return [
    {
      filter: {
        dateRange: {
          between: [new Date('2031-07-25T09:30:00.000Z'), new Date('2031-12-25T09:30:00.000Z')],
        },
        staffId: {
          in: [1, 2],
          or: null,
        },
        timeGroup: TimeGroupCode.MORNING,
      },
      expectedResult: {
        daysCount: 3,
        dates: {
          '2031-08-25': 2,
          '2031-10-25': 5,
          '2031-12-25': 1,
        },
      },
    },
  ];
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
      appointmentTypeId: 1
    },
  };
}

export function assertNoIdDuplicatesValidInputTestData() {
  return [
    {
      update: null,
    },
    {
      update: [],
    },
    {
      update: [
        buildUpdateAvailabilityDto(1, 1, 1, 1, ''),
        buildUpdateAvailabilityDto(2, 1, 1, 1, ''),
        buildUpdateAvailabilityDto(3, 1, 1, 1, ''),
      ],
    },
  ];
}

export function assertNoIdDuplicatesInvalidInputTestData(): UpdateAvailabilityDto[] {
  return [
    buildUpdateAvailabilityDto(1, 1, 1, 1, ''),
    buildUpdateAvailabilityDto(2, 1, 1, 1, ''),
    buildUpdateAvailabilityDto(1, 1, 1, 1, ''),
  ];
}

export function assertNoSharedIdsValidInputTestData() {
  return [
    {
      remove: null,
      update: null,
    },
    {
      remove: null,
      update: [],
    },
    {
      remove: [],
      update: null,
    },
    {
      remove: [],
      update: [],
    },
    {
      remove: [1],
      update: [],
    },
    {
      remove: [1],
      update: null,
    },
    {
      remove: [],
      update: [buildUpdateAvailabilityDto(1, 1, 1, 1, '')],
    },
    {
      remove: [1, 5],
      update: [
        buildUpdateAvailabilityDto(2, 1, 1, 1, ''),
        buildUpdateAvailabilityDto(3, 1, 1, 1, ''),
        buildUpdateAvailabilityDto(4, 1, 1, 1, ''),
      ],
    },
  ];
}

export function assertNoSharedIdsInvalidInputTestData() {
  return {
    remove: [1, 2, 3],
    update: [
      buildUpdateAvailabilityDto(3, 1, 1, 1, ''),
      buildUpdateAvailabilityDto(4, 1, 1, 1, ''),
      buildUpdateAvailabilityDto(5, 1, 1, 1, ''),
    ],
  };
}

export function validateBulkUpdateAvailabilityDtoValidTestData() {
  return {
    remove: [1, 2],
    update: [buildUpdateAvailabilityDto(3, 1, 1, 1, ''), buildUpdateAvailabilityDto(4, 1, 1, 1, '')],
    create: [
      createAvailabilityDto(1, '2025-07-25T07:43:40.084Z', 15, 1),
      createAvailabilityDto(1, '2025-08-25T08:43:40.084Z', 15, 1),
    ],
  };
}

export function validateAppointmentTypesIdsValidTestData(): BulkUpdateAvailabilityDto[] {
  return [
    {
      update: null,
      create: null,
      remove: null,
    },
    {
      update: [],
      create: [],
      remove: null,
    },
    {
      update: [buildUpdateAvailabilityDto(3, 1, 1, 1, ''), buildUpdateAvailabilityDto(4, 1, 1, 1, '')],
      create: null,
      remove: null,
    },
    {
      update: [],
      create: [
        createAvailabilityDto(1, '2025-07-25T07:43:40.084Z', 15, 1),
        createAvailabilityDto(1, '2025-08-25T08:43:40.084Z', 15, 1),
      ],
      remove: null,
    },
    {
      update: [buildUpdateAvailabilityDto(3, 1, 1, 1, ''), buildUpdateAvailabilityDto(4, 1, 1, 1, '')],
      create: [
        createAvailabilityDto(1, '2025-07-25T07:43:40.084Z', 15, 1),
        createAvailabilityDto(1, '2025-08-25T08:43:40.084Z', 15, 1),
      ],
      remove: null,
    },
  ];
}

export function validateAppointmentTypesIdsInvalidTestCase() {
  return {
    payload: {
      update: [
        buildUpdateAvailabilityDto(3, 1, 1, 1, ''),
        buildUpdateAvailabilityDto(4, 2, 1, 1, ''),
        buildUpdateAvailabilityDto(5, 4, 1, 1, ''),
      ],
      create: [
        createAvailabilityDto(1, '2025-07-25T07:43:40.084Z', 15, 1),
        createAvailabilityDto(1, '2025-08-26T08:43:40.084Z', 15, 6),
        createAvailabilityDto(1, '2025-08-27T08:43:40.084Z', 15, 5),
      ],
      remove: null,
    },
    expectedErrorMessage: "The appointment types doesn't exist: [6,5,4]",
  };
}

export function buildUpdateAvailabilityDto(
  id,
  appointmentTypeId,
  durationMinutes,
  staffId,
  startDate,
): UpdateAvailabilityDto {
  return {
    id,
    appointmentTypeId,
    durationMinutes,
    staffId,
    startDate,
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

export function createAvailabilityDto(
  staffId: number,
  startDate: string,
  durationMinutes: number,
  appointmentTypeId: number,
) {
  const availabilityDto: CreateAvailabilityDto = new CreateAvailabilityDto();
  availabilityDto.staffId = staffId;
  availabilityDto.startDate = startDate;
  availabilityDto.durationMinutes = durationMinutes;
  availabilityDto.appointmentTypeId = appointmentTypeId;
  return availabilityDto;
}
