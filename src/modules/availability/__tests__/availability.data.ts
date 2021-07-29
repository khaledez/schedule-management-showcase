import { CreateAvailabilityGroupBodyDto } from 'modules/availability/dto/create-availability-group-body.dto';
import { CreateAvailabilityDto } from 'modules/availability/dto/create.dto';
import { BadRequestException } from '@nestjs/common';
import { ClassType } from 'class-transformer/ClassTransformer';

export function testCreateAvailabilityGroupInvalidAppointments(): {
  dto: CreateAvailabilityGroupBodyDto;
  message: string;
  ids: number[];
} {
  const dto: CreateAvailabilityGroupBodyDto = new CreateAvailabilityGroupBodyDto();
  dto.availabilityGroup = [
    buildCreateAvailabilityDto(1, '2034-05-25T07:43:40.084Z', 15, 4),
    buildCreateAvailabilityDto(1, '2034-05-25T07:43:40.084Z', 15, 1),
    buildCreateAvailabilityDto(1, '2034-05-25T07:43:40.084Z', 15, 5),
  ];
  return {
    dto,
    message: "The appointment types doesn't exist",
    ids: [4, 5],
  };
}

export function testCreateAvailabilityGroupSuccess(): {
  dto: CreateAvailabilityGroupBodyDto;
  result: Array<CreateAvailabilityDto>;
} {
  const dto: CreateAvailabilityGroupBodyDto = new CreateAvailabilityGroupBodyDto();
  dto.availabilityGroup = [
    buildCreateAvailabilityDto(1, '2034-05-25T07:43:40.084Z', 5, 1),
    buildCreateAvailabilityDto(2, '2034-06-25T07:43:40.084Z', 10, 2),
  ];
  return {
    dto,
    result: [
      {
        staffId: 1,
        startDate: '2034-05-25T07:43:40.084Z',
        durationMinutes: 5,
        appointmentTypeId: 1,
      },
      {
        staffId: 2,
        startDate: '2034-06-25T07:43:40.084Z',
        durationMinutes: 10,
        appointmentTypeId: 2,
      },
    ],
  };
}

function buildCreateAvailabilityDto(
  staffId: number,
  startDate: string,
  durationMinutes: number,
  appointmentTypeId: number,
): CreateAvailabilityDto {
  return {
    staffId,
    startDate,
    durationMinutes,
    appointmentTypeId,
  };
}
