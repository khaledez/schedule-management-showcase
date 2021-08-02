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
        findAll: jest.fn(() => entry.data),
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

  it('should be defined', () => {
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
});
