import { CreateAvailabilityDto } from './create.dto';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAvailabilityGroupBodyDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => CreateAvailabilityDto)
  @ValidateNested({ each: true })
  availabilityGroup: Array<CreateAvailabilityDto>;
}
