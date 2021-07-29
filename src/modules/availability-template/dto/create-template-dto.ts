import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsString, ValidateNested } from 'class-validator';
import { AvailabilityTemplateAttributes } from '../interfaces/availability-template.interface';
import { CreateSlotDto } from './create-slot.dto';

export class CreateAvailabilityTemplateDto implements AvailabilityTemplateAttributes {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSlotDto)
  @ArrayMinSize(1)
  availabilitySlots: CreateSlotDto[];
}
