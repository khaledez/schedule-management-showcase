import { IsNumber, IsString, IsISO8601 } from 'class-validator';
import { BaseModelAttributes } from 'src/common/models';
import { AvailabilityModelAttributes } from '../models/availability.interfaces';

export class CreateAvailabilityDto
  implements Omit<AvailabilityModelAttributes, keyof BaseModelAttributes | 'id' | 'startTime' | 'endDate' | 'date'> {
  @IsNumber()
  staffId: number;

  @IsString()
  @IsISO8601({ strict: true })
  startDate: string;

  @IsNumber()
  durationMinutes: number;

  @IsNumber()
  appointmentTypeId: number;
}
