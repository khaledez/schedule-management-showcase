import { Type } from 'class-transformer';
import { IsMilitaryTime, IsNumber } from 'class-validator';
import { AvailabilitySlotAttributes } from '../interfaces/availability-template-slot.interface';

export type CreateSlotAttributes = Omit<AvailabilitySlotAttributes, 'id' | 'clinicId' | 'availabilityTemplateId'>;

export class CreateSlotDto implements CreateSlotAttributes {
  @IsNumber()
  @Type(() => Number)
  appointmentTypeId: number;

  @IsMilitaryTime({ message: 'Must be a valid representation of time in format HH:MM or HH:MM:SS' })
  startTime: string;

  @IsNumber()
  @Type(() => Number)
  durationMinutes: number;
}
