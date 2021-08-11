import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateAvailabilityDto } from './create.dto';
import { UpdateAvailabilityDto } from './update.dto';

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
  delete: Array<number> = [];
}
