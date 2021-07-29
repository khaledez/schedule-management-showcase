import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityController } from 'modules/availability/availability.controller';
import { AvailabilityService } from 'modules/availability/availability.service';
import { availabilityProviders } from 'modules/availability/availability.provider';
import { DatabaseModule } from 'modules/database/database.module';
import { EventsModule } from 'modules/events/events.module';
import { LookupsModule } from 'modules/lookups/lookups.module';
import { ConfigurationModule } from 'modules/config/config.module';
import { dropDB, prepareTestDB } from 'utils/test-helpers/DatabaseHelpers';
import { getTestIdentity } from 'utils/test-helpers/common-data-helpers';
import {
  testCreateAvailabilityGroupInvalidAppointments,
  testCreateAvailabilityGroupSuccess,
} from 'modules/availability/__tests__/availability.data';

const USER_ID = 12;
const CLINIC_ID = 13;

describe('AvailabilityService', () => {
  let module: TestingModule;
  let service: AvailabilityService;

  beforeAll(async () => {
    await prepareTestDB();

    module = await Test.createTestingModule({
      imports: [DatabaseModule, EventsModule, LookupsModule, ConfigurationModule],
      controllers: [AvailabilityController],
      providers: [AvailabilityService, ...availabilityProviders],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
  });

  afterAll(async () => {
    await module.close();
    await dropDB();
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  test("# createAvailabilityGroup # The appointment types doesn't exist", async () => {
    const testData = testCreateAvailabilityGroupInvalidAppointments();
    try {
      await service.createAvailabilityGroup(testData.dto, getTestIdentity(USER_ID, CLINIC_ID));
      fail("Shouldn't have made it here");
    } catch (error) {
      expect(error.response).toHaveProperty('message', testData.message);
      expect(error.response).toHaveProperty('ids', testData.ids);
    }
  });

  test('# createAvailabilityGroup # created successfully', async () => {
    const testData = testCreateAvailabilityGroupSuccess();
    const result = await service.createAvailabilityGroup(testData.dto, getTestIdentity(USER_ID, CLINIC_ID));
    expect(result.length).toEqual(testData.result.length);
    result.forEach((availability, index) => {
      expect(availability.appointmentTypeId).toEqual(testData.result[index].appointmentTypeId);
      expect(availability.staffId).toEqual(testData.result[index].staffId);
      expect(availability.durationMinutes).toEqual(testData.result[index].durationMinutes);
      expect(availability.startDate.toISOString()).toEqual(testData.result[index].startDate);
    });
  });
});
