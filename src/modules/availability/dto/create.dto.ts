import { Transform } from 'class-transformer';
import { IsNumber, IsString, IsISO8601, IsPositive } from 'class-validator';
import { BaseModelAttributes } from 'common/models';
import { AvailabilityModelAttributes } from '../models/availability.interfaces';
import { IsFutureDateTime } from 'common/decorators/IsFutureDateTime';

export class CreateAvailabilityDto
  implements
    Omit<AvailabilityModelAttributes, keyof BaseModelAttributes | 'id' | 'startTime' | 'endDate' | 'startDate'>
{
  @IsNumber()
  @Transform((val) => parseInt(val))
  staffId: number;

  @IsString()
  @IsISO8601({ strict: true })
  @IsFutureDateTime()
  startDate: string;

  @IsNumber()
  @Transform((val) => parseInt(val))
  @IsPositive()
  durationMinutes: number;

  @IsNumber()
  @Transform((val) => parseInt(val))
  appointmentTypeId: number;
}
