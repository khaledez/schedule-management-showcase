import { Test, TestingModule } from '@nestjs/testing';
import { LookupsService } from 'modules/lookups/lookups.service';
import { BadRequestException } from '@nestjs/common';
import { DatabaseModule } from 'modules/database/database.module';
import { EventsModule } from 'modules/events/events.module';
import { LookupsModule } from 'modules/lookups/lookups.module';
import { AvailabilityController } from 'modules/availability/availability.controller';
import { AvailabilityService } from 'modules/availability/availability.service';
import { availabilityProviders } from 'modules/availability/availability.provider';
import { dropDB, prepareTestDB } from 'utils/test-helpers/DatabaseHelpers';
import { ConfigurationModule } from 'modules/config/config.module';
import { getTestIdentity } from 'utils/test-helpers/common-data-helpers';

const USER_ID = 14;
const CLINIC_ID = 15;

describe('LookupsService', () => {
  let module: TestingModule;
  let lookupsService: LookupsService;

  beforeAll(async () => {
    await prepareTestDB();

    module = await Test.createTestingModule({
      imports: [DatabaseModule, EventsModule, LookupsModule, ConfigurationModule],
      controllers: [AvailabilityController],
      providers: [AvailabilityService, ...availabilityProviders],
    }).compile();

    lookupsService = module.get<LookupsService>(LookupsService);
  });

  afterAll(async () => {
    await module.close();
    await dropDB();
  });

  it('should be defined', () => {
    expect(lookupsService).toBeDefined();
  });

  it('#validateAppointmentsTypes: All typesIds should be valid', async () => {
    await lookupsService.validateAppointmentsTypes([1, 2, 3], getTestIdentity(USER_ID, CLINIC_ID));
  });

  it('#validateAppointmentsTypes: Invalid typeIds', async () => {
    try {
      await lookupsService.validateAppointmentsTypes([5, 6, 7], getTestIdentity(USER_ID, CLINIC_ID));
      fail("Shouldn't have made it here");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.response).toHaveProperty('message', "The appointment types doesn't exist");
      expect(error.response).toHaveProperty('ids', [5, 6, 7]);
    }
  });
});
