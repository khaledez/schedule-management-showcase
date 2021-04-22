import { IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseModelAttributes } from 'src/common/models';
import { AvailabilityModelAttributes } from '../models/availability.interfaces';

export class UpdateAvailabilityDto
  implements Omit<AvailabilityModelAttributes, keyof BaseModelAttributes | 'startTime' | 'endDate' | 'date'> {
  @IsOptional()
  staffId: number;

  @IsNumber()
  id: number;

  @IsString()
  @IsISO8601({ strict: true })
  startDate: string;

  @IsNumber()
  durationMinutes: number;

  @IsNumber()
  appointmentTypeId: number;
}
