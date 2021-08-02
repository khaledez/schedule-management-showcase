import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { AvailabilitySlotAttributes } from '../interfaces/availability-template-slot.interface';

/**
 * Mimics the AvailabilityTemplate table in database
 */
export class AvailabilitySlotDto implements AvailabilitySlotAttributes {
  @IsNumber()
  @Type(() => Number)
  appointmentTypeId: number;

  @IsString()
  startTime: string;

  @IsNumber()
  @Type(() => Number)
  durationMinutes: number;

  @IsNumber()
  @Type(() => Number)
  createdBy: number;

  @IsNumber()
  @Type(() => Number)
  clinicId: number;
}
