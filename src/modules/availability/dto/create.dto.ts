import { Transform } from 'class-transformer';
import { IsNumber, IsString, IsISO8601 } from 'class-validator';
import { BaseModelAttributes } from 'src/common/models';
import { AvailabilityModelAttributes } from '../models/availability.interfaces';

export class CreateAvailabilityDto
  implements
    Omit<AvailabilityModelAttributes, keyof BaseModelAttributes | 'id' | 'startTime' | 'endDate' | 'startDate'> {
  @IsNumber()
  @Transform((val) => parseInt(val))
  staffId: number;

  @IsString()
  @IsISO8601({ strict: true })
  startDate: string;

  @IsNumber()
  @Transform((val) => parseInt(val))
  durationMinutes: number;

  @IsNumber()
  @Transform((val) => parseInt(val))
  appointmentTypeId: number;
}
