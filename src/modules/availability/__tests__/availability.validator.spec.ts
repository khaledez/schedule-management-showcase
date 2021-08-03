import { AvailabilityValidator } from 'modules/availability/availability.validator';
import { BadRequestException } from '@nestjs/common';
import {
  assertNoIdDuplicatesInvalidInputTestData,
  assertNoIdDuplicatesValidInputTestData,
  assertNoSharedIdsInvalidInputTestData,
  assertNoSharedIdsValidInputTestData,
  validateBulkUpdateAvailabilityDtoValidTestData,
} from 'modules/availability/__tests__/availability.data';
import { BulkUpdateAvailabilityDto } from 'modules/availability/dto/add-or-update-availability-body.dto';

describe('AvailabilityValidator', () => {
  const validator: AvailabilityValidator = new AvailabilityValidator();

  test('#findOverlappedPeriods: No overlapped periods', () => {
    const periods = [
      {
        id: 1,
        startDateTs: new Date('2021-07-25T07:43:40.084Z').getTime(),
        endDateTs: new Date('2021-07-25T07:58:40.084Z').getTime(),
      },
      {
        id: 2,
        startDateTs: new Date('2021-07-25T08:43:40.084Z').getTime(),
        endDateTs: new Date('2021-07-25T08:58:40.084Z').getTime(),
      },
      {
        id: 3,
        startDateTs: new Date('2021-07-25T09:43:40.084Z').getTime(),
        endDateTs: new Date('2021-07-25T09:58:40.084Z').getTime(),
      },
    ];
    const result = AvailabilityValidator.findOverlappedPeriods(periods);
    expect(result).toEqual([]);
  });

  test('#findOverlappedPeriods: Should have overlapped periods', () => {
    const periods = [
      {
        id: 1,
        startDateTs: new Date('2021-07-25T07:43:40.084Z').getTime(),
        endDateTs: new Date('2021-07-25T10:58:40.084Z').getTime(),
      },
      {
        id: 2,
        startDateTs: new Date('2021-07-25T08:43:40.084Z').getTime(),
        endDateTs: new Date('2021-07-25T10:58:40.084Z').getTime(),
      },
      {
        id: 3,
        startDateTs: new Date('2021-07-25T09:43:40.084Z').getTime(),
        endDateTs: new Date('2021-07-25T09:58:40.084Z').getTime(),
      },
    ];
    const result = AvailabilityValidator.findOverlappedPeriods(periods);
    expect(result).toEqual([
      {
        availabilityIndex: 1,
        overlappedWith: [2, 3],
      },
      {
        availabilityIndex: 2,
        overlappedWith: [3],
      },
    ]);
  });

  test.each(assertNoIdDuplicatesValidInputTestData())('#assertNoIdDuplicates valid input: %p', (testCase) => {
    validator.assertNoIdDuplicates(testCase.update);
  });

  test('#assertNoIdDuplicates invalid input', () => {
    const update = assertNoIdDuplicatesInvalidInputTestData();
    try {
      validator.assertNoIdDuplicates(update);
      fail("Shouldn't have made it here");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response).toHaveProperty('message', 'duplicate entries in the update list');
    }
  });

  test.each(assertNoSharedIdsValidInputTestData())('#assertNoSharedIds valid input: %p', (testCase) => {
    validator.assertNoSharedIds(testCase.remove, testCase.update);
  });

  test('#assertNoSharedIds invalid input', () => {
    const payload = assertNoSharedIdsInvalidInputTestData();
    try {
      validator.assertNoSharedIds(payload.remove, payload.update);
      fail("Shouldn't have made it here");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response).toHaveProperty('message', 'You cannot update & delete the same record in the same time');
    }
  });

  test('#validateBulkUpdateAvailabilityDto invalid dto', () => {
    const payload = new BulkUpdateAvailabilityDto();
    try {
      validator.validateBulkUpdateAvailabilityDto(payload);
      fail("Shouldn't have made it here");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response).toHaveProperty('message', 'At least one operation must be provided');
    }
  });

  test('#validateBulkUpdateAvailabilityDto invalid dto', () => {
    const payload = validateBulkUpdateAvailabilityDtoValidTestData();
    validator.validateBulkUpdateAvailabilityDto(payload);
  });
});
