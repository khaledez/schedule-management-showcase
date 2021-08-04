import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityController } from 'modules/availability/availability.controller';
import { AvailabilityService } from 'modules/availability/availability.service';
import { availabilityProviders } from 'modules/availability/availability.provider';
import { DatabaseModule } from 'modules/database/database.module';
import { EventsModule } from 'modules/events/events.module';
import { LookupsModule } from 'modules/lookups/lookups.module';
import { ConfigurationModule } from 'modules/config/config.module';
import { getTestIdentity } from 'utils/test-helpers/common-data-helpers';
import {
  buildGetNineAvailabilitySuggestionsTestData,
  buildGetOneAvailabilitySuggestionsTestData,
  buildGetZeroAvailabilitySuggestionsTestData,
  buildUpdateAvailabilityDto,
  createAvailabilityDto,
  getStaffIdWhereClauseTestCases,
  getSuggestionsData,
  getSuggestionsPriorityComparatorTestCases,
  getToCalendarEntryTestData,
  validateAppointmentTypesIdsInvalidTestCase,
  validateAppointmentTypesIdsValidTestData,
} from 'modules/availability/__tests__/availability.data';
import { BadRequestException, forwardRef, NotFoundException } from '@nestjs/common';
import { AppointmentsModule } from 'modules/appointments/appointments.module';
import {
  APPOINTMENT_PROXIMITY_DAYS,
  APPOINTMENT_SUGGESTIONS_RETURN_LIMIT,
  BAD_REQUEST,
  DAY_TO_MILLI_SECOND,
} from 'common/constants';
import { Op } from 'sequelize';
import { BulkUpdateAvailabilityDto } from 'modules/availability/dto/add-or-update-availability-body.dto';

describe('# AvailabilityService', () => {
  let module: TestingModule;
  let availabilityService: AvailabilityService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule, EventsModule, LookupsModule, ConfigurationModule, forwardRef(() => AppointmentsModule)],
      controllers: [AvailabilityController],
      providers: [AvailabilityService, ...availabilityProviders],
    }).compile();
    availabilityService = module.get<AvailabilityService>(AvailabilityService);
  });

  afterAll(async (done) => {
    await module.close();
    done();
  });

  test('should be defined', () => {
    expect(availabilityService).toBeDefined();
  });

  describe('# availability bulk action functionality', () => {
    const identity = getTestIdentity(26, 26);
    const createdAvailabilitiesIds = [];

    afterAll(async () => {
      await availabilityService.bulkRemove(createdAvailabilitiesIds, identity, null);
    });

    test.each(validateAppointmentTypesIdsValidTestData())(
      '# validateAppointmentTypesIds valid input: %p',
      async (testCase) => {
        await availabilityService.validateAppointmentTypesIds(getTestIdentity(62, 62), testCase);
      },
    );

    test('# validateAppointmentTypesIds invalid input', async () => {
      const testCase = validateAppointmentTypesIdsInvalidTestCase();
      try {
        await availabilityService.validateAppointmentTypesIds(getTestIdentity(62, 62), testCase.payload);
        fail("Shouldn't have made it here");
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.response).toHaveProperty('message', testCase.expectedErrorMessage);
      }
    });

    test('# bulkAction all three actions', async () => {
      const initialStaffId = 1;
      const initialDuration = 15;
      const initialTypeId = 1;
      const initialDate = '2025-07-25T07:43:40.084Z';
      const updatedStaffId = 2;
      const updatedDuration = 20;
      const updatedTypeId = 2;

      const identity = getTestIdentity(82, 82);
      const payload = new BulkUpdateAvailabilityDto();

      payload.create = [createAvailabilityDto(initialStaffId, initialDate, initialDuration, initialTypeId)];
      const createResult = await availabilityService.bulkAction(identity, payload);
      createResult.created.forEach((availability) => createdAvailabilitiesIds.push(availability.id));
      expect(1).toEqual(createResult.created.length);

      payload.update = [
        buildUpdateAvailabilityDto(
          createResult.created[0].id,
          updatedTypeId,
          updatedDuration,
          updatedStaffId,
          initialDate,
        ),
      ];
      const updateResult = await availabilityService.bulkAction(identity, payload);
      updateResult.created.forEach((availability) => createdAvailabilitiesIds.push(availability.id));
      expect(1).toEqual(updateResult.created.length);
      expect(1).toEqual(updateResult.updated.length);
      expect(updatedTypeId).toEqual(updateResult.updated[0].appointmentTypeId);
      expect(updatedStaffId).toEqual(updateResult.updated[0].staffId);
      expect(updatedDuration).toEqual(updateResult.updated[0].durationMinutes);

      payload.remove = [updateResult.updated[0].id, updateResult.created[0].id];
      payload.create = null;
      payload.update = null;
      await availabilityService.bulkAction(identity, payload);
      try {
        await availabilityService.findOne(payload.remove[0]);
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect(err.response).toHaveProperty('message', 'This availability does not exits!');
      }
      try {
        await availabilityService.findOne(payload.remove[1]);
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect(err.response).toHaveProperty('message', 'This availability does not exits!');
      }
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

    test.each(getStaffIdWhereClauseTestCases())('# getStaffIdWhereClause', (testCase) => {
      expect(availabilityService.getEntityIdWhereClause(testCase.filter)).toEqual(testCase.expected);
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
