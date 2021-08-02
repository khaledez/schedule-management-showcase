import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  APPOINTMENT_STATUS_LOOKUPS_REPOSITORY,
  APPOINTMENT_TYPES_LOOKUPS_REPOSITORY,
  APPOINTMENT_VISIT_MODE_LOOKUP_REPOSITORY,
} from 'common/constants';
import { lookupsProviders } from 'modules/lookups/lookups.provider';
import { LookupsService } from 'modules/lookups/lookups.service';
import {
  appointmentStatusLookupData,
  appointmentTypesLookupData,
  appointmentVisitModeLookupData,
} from 'modules/lookups/__tests__/lookups.data';
import { getTestIdentity } from 'utils/test-helpers/common-data-helpers';

describe('LookupsService', () => {
  let lookupsService: LookupsService;

  const testLookupProviders = [
    { provide: APPOINTMENT_TYPES_LOOKUPS_REPOSITORY, data: appointmentTypesLookupData() },
    { provide: APPOINTMENT_VISIT_MODE_LOOKUP_REPOSITORY, data: appointmentVisitModeLookupData() },
    { provide: APPOINTMENT_STATUS_LOOKUPS_REPOSITORY, data: appointmentStatusLookupData() },
  ].map((entry: { provide: string; data: any[] }) => {
    return {
      ...entry,
      useValue: {
        findAll: jest.fn(({ where }) => {
          if (where?.id) {
            if (Array.isArray(where.id)) {
              const r = entry.data.filter((val) => where.id.includes(val.id));
              return r;
            }
            return entry.data.filter((val) => val.id === where.id);
          }
          return entry.data;
        }),
        findByPk: jest.fn((id) => {
          const filtered = entry.data.filter((value) => value.id === id);
          return filtered.length !== 0 ? filtered[0] : null;
        }),
      },
    };
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LookupsService, ...lookupsProviders, ...testLookupProviders],
    }).compile();
    lookupsService = await module.get<LookupsService>(LookupsService);
  });

  test('should be defined', () => {
    expect(lookupsService).toBeDefined();
  });

  test.each([
    { id: 1, expected: true },
    { id: 5, expected: false },
  ])('# doesAppointmentTypeExist: %p', async (testCase) => {
    const result: boolean = await lookupsService.doesAppointmentTypeExist(testCase.id);
    expect(result).toEqual(testCase.expected);
  });

  test.each([{ ids: null }, { ids: [] }, { ids: [1, 2, 3], willThrowException: false }])(
    '# validateAppointmentsTypes valid ids: %p',
    async (testCase) => {
      await lookupsService.validateAppointmentsTypes(getTestIdentity(50, 50), testCase.ids);
    },
  );

  test.each([
    { ids: [5, 6, 7], notFoundIds: [5, 6, 7] },
    { ids: [2, 3, 4], notFoundIds: [4] },
  ])('# validateAppointmentsTypes has invalid ids: %p', async (testCase) => {
    try {
      await lookupsService.validateAppointmentsTypes(getTestIdentity(50, 50), testCase.ids);
      fail("Shouldn't have made it here");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response).toHaveProperty('message', "The appointment types doesn't exist");
      expect(err.response).toHaveProperty('ids', testCase.notFoundIds);
    }
  });

  // Visit mode validate tests
  test('appointmentVisitMode validate empty ids', async () => {
    await Promise.all([
      expect(lookupsService.validateAppointmentVisitModes(getTestIdentity(50, 50), [])).resolves.toBeUndefined(),
      expect(lookupsService.validateAppointmentVisitModes(getTestIdentity(50, 50), null)).resolves.toBeUndefined(),
      expect(lookupsService.validateAppointmentVisitModes(getTestIdentity(50, 50), [null])).rejects.toThrow(
        /unknown visit mode ID/,
      ),
    ]);
  });

  test.each([
    { input: [7, 8], unknownIds: [7, 8] },
    { input: [1, 2, 5, 6], unknownIds: [5, 6] },
    { input: [6, 7, 8], unknownIds: [6, 7, 8] },
  ])('appointmentVisitMode validate not found ids %#', async ({ input, unknownIds }) => {
    await expect(lookupsService.validateAppointmentVisitModes(getTestIdentity(50, 50), input)).rejects.toMatchObject({
      response: { fields: ['appointmentVisitModeId'], unknownIds },
    });
  });
});
