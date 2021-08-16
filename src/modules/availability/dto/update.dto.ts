import { Transform } from 'class-transformer';
import { IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseModelAttributes } from '../../../common/models';
import { AvailabilityModelAttributes } from '../models/availability.interfaces';

export class UpdateAvailabilityDto
  implements Omit<AvailabilityModelAttributes, keyof BaseModelAttributes | 'startTime' | 'endDate' | 'startDate'> {
  @IsOptional()
  @Transform((val) => parseInt(val))
  staffId: number;

  @IsNumber()
  @Transform((val) => parseInt(val))
  id: number;

  @IsString()
  @IsISO8601({ strict: true })
  // @IsFutureDateTime()
  startDate: string;

  @IsNumber()
  @Transform((val) => parseInt(val))
  durationMinutes: number;

  @IsNumber()
  @Transform((val) => parseInt(val))
  appointmentTypeId: number;
}
