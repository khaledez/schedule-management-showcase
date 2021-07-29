import { AvailabilityValidator } from 'modules/availability/availability.validator';
import { CreateAvailabilityGroupBodyDto } from 'modules/availability/dto/create-availability-group-body.dto';
import { CreateAvailabilityDto } from 'modules/availability/dto/create.dto';
import { BadRequestException } from '@nestjs/common';

describe('AvailabilityValidator', () => {
  const validator: AvailabilityValidator = new AvailabilityValidator();

  it('#findOverlappedPeriods: No overlapped periods', () => {
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

  it('#findOverlappedPeriods: Should have overlapped periods', () => {
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

  it('#validateCreateAvailabilityGroup: Should be valid CreateAvailabilityGroupBodyDto', () => {
    const payload: CreateAvailabilityGroupBodyDto = new CreateAvailabilityGroupBodyDto();
    payload.availabilityGroup = [
      createAvailabilityDto(1, '2021-07-25T07:43:40.084Z', 15, 1),
      createAvailabilityDto(1, '2021-08-25T08:43:40.084Z', 15, 1),
    ];
    validator.validateCreateAvailabilityGroup(payload);
  });

  it('#validateCreateAvailabilityGroup: Should be invalid CreateAvailabilityGroupBodyDto # invalid object type', () => {
    const payload: CreateAvailabilityGroupBodyDto = new CreateAvailabilityGroupBodyDto();
    payload.availabilityGroup = [
      {
        staffId: 1,
        startDate: '2021-07-25T07:43:40.084Z',
        durationMinutes: 100,
        appointmentTypeId: 1,
      },
    ];
    try {
      validator.validateCreateAvailabilityGroup(payload);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.response).toHaveProperty('msg', 'Invalid availability objects');
      expect(error.response).toHaveProperty('objects', [0]);
    }
  });

  it('#validateCreateAvailabilityGroup: Should have overlapped period', () => {
    const payload: CreateAvailabilityGroupBodyDto = new CreateAvailabilityGroupBodyDto();
    payload.availabilityGroup = [
      createAvailabilityDto(1, '2021-07-25T07:43:40.084Z', 100, 1),
      createAvailabilityDto(2, '2021-08-25T08:43:40.084Z', 15, 1),
    ];
    try {
      validator.validateCreateAvailabilityGroup(payload);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.response).toHaveProperty('msg', 'Overlapped periods are not allowed in a single request');
      expect(error.response).toHaveProperty('dates', { availabilityIndex: 0, overlappedWith: [1] });
    }
  });
});

function createAvailabilityDto(staffId: number, startDate: string, durationMinutes: number, appointmentTypeId: number) {
  const availabilityDto: CreateAvailabilityDto = new CreateAvailabilityDto();
  availabilityDto.staffId = staffId;
  availabilityDto.startDate = startDate;
  availabilityDto.durationMinutes = durationMinutes;
  availabilityDto.appointmentTypeId = appointmentTypeId;
  return availabilityDto;
}
