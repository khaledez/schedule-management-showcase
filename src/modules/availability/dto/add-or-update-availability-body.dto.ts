import { CreateAvailabilityDto } from './create-availability.dto';
import { IsArray, ArrayUnique, IsOptional } from 'class-validator';

export class CreateOrUpdateAvailabilityBodyDto {
  @IsArray()
  @IsOptional()
  create: Array<CreateAvailabilityDto>;

  @IsArray()
  @ArrayUnique()
  @IsOptional()
  remove: Array<number>;
}
