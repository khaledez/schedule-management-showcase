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
  buildGetNineAvailabilitySuggestionsTestData,
  buildGetOneAvailabilitySuggestionsTestData,
  buildGetZeroAvailabilitySuggestionsTestData,
  getExtractDayTimeInSecondsTestCases,
  getStaffIdWhereClauseTestCases,
  getSuggestionsData,
  getSuggestionsPriorityComparatorTestCases,
  getToCalendarEntryTestData,
  getTransformDayTimeToSecondsTestCases,
  testCreateAvailabilityGroupInvalidAppointments,
  testCreateAvailabilityGroupSuccess,
} from 'modules/availability/__tests__/availability.data';
import { BadRequestException, forwardRef } from '@nestjs/common';
import { AppointmentsModule } from 'modules/appointments/appointments.module';
import {
  APPOINTMENT_PROXIMITY_DAYS,
  APPOINTMENT_SUGGESTIONS_RETURN_LIMIT,
  BAD_REQUEST,
  DAY_TO_MILLI_SECOND,
} from 'common/constants';
import { Op } from 'sequelize';
import { fail } from 'assert';

describe('# AvailabilityService', () => {
  let module: TestingModule;
  let availabilityService: AvailabilityService;

  beforeAll(async () => {
    await prepareTestDB();

    module = await Test.createTestingModule({
      imports: [DatabaseModule, EventsModule, LookupsModule, ConfigurationModule, forwardRef(() => AppointmentsModule)],
      controllers: [AvailabilityController],
      providers: [AvailabilityService, ...availabilityProviders],
    }).compile();

    availabilityService = module.get<AvailabilityService>(AvailabilityService);
  });

  afterAll(async (done) => {
    await module.close();
    await dropDB();
    done();
  });

  test('should be defined', () => {
    expect(availabilityService).toBeDefined();
  });

  describe('# Create availability group functionality', () => {
    const identity = getTestIdentity(26, 26);
    const createdAvailabilitiesIds = [];

    afterAll(async () => {
      await availabilityService.bulkRemove(createdAvailabilitiesIds, identity, null);
    });

    test("# createAvailabilityGroup # The appointment types doesn't exist", async () => {
      const testData = testCreateAvailabilityGroupInvalidAppointments();
      try {
        const result = await availabilityService.createAvailabilityGroup(testData.dto, identity);
        result.forEach((avail) => createdAvailabilitiesIds.push(avail.id));
        fail("Shouldn't have made it here");
      } catch (error) {
        expect(error.response).toHaveProperty('message', testData.message);
        expect(error.response).toHaveProperty('ids', testData.ids);
      }
    });

    test('# createAvailabilityGroup # created successfully', async () => {
      const testData = testCreateAvailabilityGroupSuccess();
      const result = await availabilityService.createAvailabilityGroup(testData.dto, identity);
      result.forEach((avail) => createdAvailabilitiesIds.push(avail.id));
      expect(result.length).toEqual(testData.result.length);
      result.forEach((availability, index) => {
        expect(availability.appointmentTypeId).toEqual(testData.result[index].appointmentTypeId);
        expect(availability.staffId).toEqual(testData.result[index].staffId);
        expect(availability.durationMinutes).toEqual(testData.result[index].durationMinutes);
        expect(availability.startDate.toISOString()).toEqual(testData.result[index].startDate);
      });
    });
  });

  describe('# Availability service: Suggestions functionality', () => {
    const identity = getTestIdentity(25, 25);
    const createdAvailabilitiesIds = [];
    beforeAll(async () => {
      const availabilityDtos = getSuggestionsData();
      const result = await availabilityService.bulkCreate(availabilityDtos, identity, null);
      result.forEach((availability) => {
        createdAvailabilitiesIds.push(availability.id);
      });
    });

    afterAll(async () => {
      await availabilityService.bulkRemove(createdAvailabilitiesIds, identity, null);
    });

    test.each(getTransformDayTimeToSecondsTestCases())('# transformDayTimeToSeconds', (testCase) => {
      expect(availabilityService.transformDayTimeToSeconds(testCase.dayTime)).toEqual(testCase.expected);
    });

    test.each(getExtractDayTimeInSecondsTestCases())('# extractDayTimeInSeconds', (testCase) => {
      expect(availabilityService.extractDayTimeInSeconds(new Date(testCase.date))).toEqual(testCase.expected);
    });

    test.each(getStaffIdWhereClauseTestCases())('# getStaffIdWhereClause', (testCase) => {
      expect(availabilityService.getStaffIdWhereClause(testCase.filter)).toEqual(testCase.expected);
    });

    test('# getSuggestionsDateWhereClause', () => {
      const refDate = new Date('2031-10-25T00:04:20.084Z');
      const expectedResult = {
        [Op.between]: [
          new Date(refDate.getTime() - APPOINTMENT_PROXIMITY_DAYS * DAY_TO_MILLI_SECOND),
          new Date(refDate.getTime() + APPOINTMENT_PROXIMITY_DAYS * DAY_TO_MILLI_SECOND),
        ],
      };
      expect(availabilityService.getSuggestionsDateWhereClause(refDate)).toEqual(expectedResult);
    });

    test.each(getSuggestionsPriorityComparatorTestCases())(
      '# Test comparator of getSuggestionsPriorityComparator',
      (testCase) => {
        const comparator = availabilityService.getSuggestionsPriorityComparator(testCase.timeGroup);
        const suggestions = testCase.suggestions;
        suggestions.sort(comparator);
        // Use staffId to compare between dummy objects instead of saving real objects in DB
        const idsOrder = suggestions.map((suggest) => suggest.staffId);
        expect(idsOrder).toEqual(testCase.expectedOrder);
      },
    );

    test("# getAvailabilitySuggestions: Appointment type doesn't exist", async () => {
      const dto = { patientId: 1, appointmentTypeId: 5 };
      try {
        await availabilityService.getAvailabilitySuggestions(identity, dto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.response).toHaveProperty('fields', ['appointmentTypeId']);
        expect(error.response).toHaveProperty('message', 'Unknown appointment type');
        expect(error.response).toHaveProperty('code', BAD_REQUEST);
      }
    });

    test('# getAvailabilitySuggestions: Will get 9 suggestions', async () => {
      const test = buildGetNineAvailabilitySuggestionsTestData();
      const result = await availabilityService.getAvailabilitySuggestions(identity, test.getSuggestionsDto);
      expect(APPOINTMENT_SUGGESTIONS_RETURN_LIMIT).toEqual(result.length);
      result.forEach((suggestion, index) => {
        expect(new Date(test.expectedDateOrder[index])).toEqual(suggestion.startDate);
      });
    });

    test('# getAvailabilitySuggestions: Will get 1 suggestions', async () => {
      const test = buildGetOneAvailabilitySuggestionsTestData();
      const result = await availabilityService.getAvailabilitySuggestions(identity, test.getSuggestionsDto);
      expect(test.expectedDateOrder).toEqual(result.map((avail) => avail.startDate.toISOString()));
    });

    test('# getAvailabilitySuggestions: Will get 0 suggestions', async () => {
      const test = buildGetZeroAvailabilitySuggestionsTestData();
      const result = await availabilityService.getAvailabilitySuggestions(identity, test.getSuggestionsDto);
      expect([]).toEqual(result);
    });

    test('# toCalendarEntry', () => {
      const testData = getToCalendarEntryTestData();
      const result = availabilityService.toCalendarEntry(testData.input);
      expect(testData.expectedOutput).toEqual(result);
    });
  });
});
