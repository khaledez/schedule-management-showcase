import { Test, TestingModule } from '@nestjs/testing';
import { APPOINTMENT_TYPES_LOOKUPS_REPOSITORY } from 'common/constants';
import { lookupsProviders } from 'modules/lookups/lookups.provider';
import { LookupsService } from 'modules/lookups/lookups.service';
import { AppointmentTypesLookupsModel } from 'modules/lookups/models/appointment-types.model';
import { initAppointmentTypeRepo } from 'modules/lookups/__tests__/lookups.data';

describe('LookupsService', () => {
  let lookupsService: LookupsService;
  const appointmentTypeRepo: Array<AppointmentTypesLookupsModel> = initAppointmentTypeRepo();
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LookupsService,
        ...lookupsProviders,
        {
          provide: APPOINTMENT_TYPES_LOOKUPS_REPOSITORY,
          useValue: {
            findAll: jest.fn(() => appointmentTypeRepo),
            findByPk: jest.fn((id) => {
              const filtered = appointmentTypeRepo.filter((value) => value.id === id);
              return filtered.length !== 0 ? filtered[0] : null;
            }),
          },
        },
      ],
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
});
