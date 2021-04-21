import { CreateAvailabilityDto } from './create.dto';
import { IsArray, ArrayUnique, IsOptional } from 'class-validator';
import { UpdateAvailabilityDto } from './update.dto';

export class BulkUpdateAvailabilityDto {
  @IsArray()
  @IsOptional()
  create: Array<CreateAvailabilityDto> = [];

  @IsArray()
  update: Array<UpdateAvailabilityDto> = [];

  @IsArray()
  @ArrayUnique()
  @IsOptional()
  remove: Array<number> = [];
}
