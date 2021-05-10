import { CreateAvailabilityDto } from './create.dto';
import { IsArray, ArrayUnique, IsOptional, ValidateNested } from 'class-validator';
import { UpdateAvailabilityDto } from './update.dto';
import { Type } from 'class-transformer';

export class BulkUpdateAvailabilityDto {
  @IsArray()
  @IsOptional()
  @Type(() => CreateAvailabilityDto)
  @ValidateNested({ each: true })
  create: Array<CreateAvailabilityDto> = [];

  @IsArray()
  @IsOptional()
  @Type(() => UpdateAvailabilityDto)
  @ValidateNested({ each: true })
  update: Array<UpdateAvailabilityDto> = [];

  @IsArray()
  @ArrayUnique()
  @IsOptional()
  @Type(() => Number)
  remove: Array<number> = [];
}
