import { CreateAvailabilityGroupBodyDto } from 'modules/availability/dto/create-availability-group-body.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAvailabilityDto } from 'modules/availability/dto/create.dto';
import { ValidatorBase } from 'common/validation/validator-base';

@Injectable()
export class AvailabilityValidator extends ValidatorBase {
  validateCreateAvailabilityGroup(payload: CreateAvailabilityGroupBodyDto) {
    const availabilities: Array<CreateAvailabilityDto> = payload.availabilityGroup;
    this.assertArrayElementsType(availabilities, CreateAvailabilityDto, 'Invalid availability objects');
    this.assertNoPeriodsOverlapped(availabilities, 'Overlapped periods are not allowed in a single request');
  }

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
