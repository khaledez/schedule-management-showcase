import { IsNumber, IsString } from 'class-validator';
import { AvailabilitySlotAttributes } from '../interfaces/availability-template-slot.interface';

/**
 * Mimics the AvailabilityTemplate table in database
 */
export class AvailabilitySlotDto implements AvailabilitySlotAttributes {
  @IsNumber()
  appointmentTypeId: number;

  @IsString()
  startTime: string;

  @IsNumber()
  durationMinutes: number;

  @IsNumber()
  createdBy: number;

  @IsNumber()
  clinicId: number;
}
