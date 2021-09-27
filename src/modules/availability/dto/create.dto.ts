import { Transform } from 'class-transformer';
import { IsISO8601, IsNumber, IsPositive, IsString } from 'class-validator';
import { BaseModelAttributes } from 'common/models';
import { AvailabilityModelAttributes } from '../models/availability.interfaces';

export class CreateAvailabilityDto
  implements
    Omit<AvailabilityModelAttributes, keyof BaseModelAttributes | 'id' | 'startTime' | 'endDate' | 'startDate'>
{
  @IsNumber()
  @Transform((val) => parseInt(val))
  staffId: number;

  @IsString()
  @IsISO8601({ strict: true })
  // @IsFutureDateTime()
  startDate: string;

  @IsNumber()
  @Transform((val) => parseInt(val))
  @IsPositive()
  durationMinutes: number;

  @IsNumber()
  @Transform((val) => parseInt(val))
  appointmentTypeId: number;

  /**
   * used in internal calls only
   */
  isOccupied?: boolean;
}
