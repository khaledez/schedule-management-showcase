import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAvailabilityDto } from 'modules/availability/dto/create.dto';
import { ValidatorBase } from 'common/validation/validator-base';
import { BulkUpdateAvailabilityDto } from 'modules/availability/dto/add-or-update-availability-body.dto';
import { ErrorCodes } from 'common/enums';
import { UpdateAvailabilityDto } from 'modules/availability/dto/update.dto';
import { BAD_REQUEST } from 'common/constants';

@Injectable()
export class AvailabilityValidator extends ValidatorBase {
  /**
   * Validates availability bulk actions
   */
  validateBulkUpdateAvailabilityDto(payload: BulkUpdateAvailabilityDto) {
    const { create, remove, update } = payload;
    if (!create.length && !remove.length && !update.length) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_INPUT,
        message: 'At least one operation must be provided',
      });
    }
    this.assertArrayElementsType(create, CreateAvailabilityDto, 'Invalid availability objects');
    this.assertNoPeriodsOverlapped(create, 'Overlapped periods are not allowed in a single request');
    this.assertNoSharedIds(remove, update);
    this.assertNoIdDuplicates(update);
  }

  /**
   * Make sure no conflicts between updated availabilities and deleted ones
   */
  assertNoSharedIds(remove: Array<number>, update: Array<UpdateAvailabilityDto>) {
    if (update?.filter((updReq) => remove?.includes(updReq.id))?.length > 0) {
      throw new BadRequestException({
        code: BAD_REQUEST,
        message: 'You cannot update & delete the same record in the same time',
      });
    }
  }

  /**
   * Check payload doesn't have two updates or more for the same object id
   */
  assertNoIdDuplicates(update: Array<UpdateAvailabilityDto>) {
    const uniqueIds = new Set(update?.map((updReq) => updReq.id));
    if (uniqueIds.size > 0 && update?.length !== uniqueIds.size) {
      throw new BadRequestException({
        code: BAD_REQUEST,
        message: 'duplicate entries in the update list',
      });
    }
  }

  /**
   * Assert create availability group doesn't have overlapping in the creation request
   */
  assertNoPeriodsOverlapped(availabilities: Array<CreateAvailabilityDto>, errorMessage): void {
    if (availabilities.length === 1) {
      return;
    }

    const periods = availabilities.map((availability, index) => {
      const durationInMillSeconds = availability.durationMinutes * 60000;
      const startDateTs: number = new Date(availability.startDate).getTime();
      const endDateTs: number = new Date(startDateTs + durationInMillSeconds).getTime();
      return { id: index, startDateTs, endDateTs };
    });

    const overlappedPeriods = AvailabilityValidator.findOverlappedPeriods(periods);
    if (overlappedPeriods.length !== 0) {
      throw new BadRequestException({
        msg: errorMessage,
        dates: overlappedPeriods,
      });
    }
  }

  static findOverlappedPeriods(periods) {
    periods.sort((objA, objB): number => objA.startDateTs - objB.startDateTs);
    const overlappedPeriods = [];
    for (let i = 0; i < periods.length - 1; i++) {
      const currentPeriod = periods[i];
      const overlappedWith = [];
      for (let j = i + 1; j < periods.length; j++) {
        const tempPeriod = periods[j];
        if (currentPeriod.startDateTs === tempPeriod.startDateTs) {
          overlappedWith.push(tempPeriod.id);
        } else if (currentPeriod.endDateTs > tempPeriod.startDateTs) {
          overlappedWith.push(tempPeriod.id);
        }
      }
      if (overlappedWith.length !== 0) {
        overlappedPeriods.push({
          availabilityIndex: currentPeriod.id,
          overlappedWith,
        });
      }
    }
    return overlappedPeriods;
  }
}
