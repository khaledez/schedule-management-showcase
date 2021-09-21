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
