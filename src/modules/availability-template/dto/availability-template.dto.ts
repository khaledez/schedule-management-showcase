import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { AvailabilityTemplateAttributes } from '../interfaces/availability-template.interface';
import { AvailabilitySlotDto } from './availability-template-slot.dto';

/**
 * Mimics the AvailabilityTemplate table in database
 */
export class AvailabilityTemplateDto implements AvailabilityTemplateAttributes {
  @IsNumber()
  @Type(() => Number)
  createdBy: number;

  @IsNumber()
  @Type(() => Number)
  clinicId: number;

  @IsString()
  name: string;

  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  availabilitySlots: AvailabilitySlotDto[];
}
