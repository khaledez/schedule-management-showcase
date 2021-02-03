import { CreateAvailabilityDto } from './create-availability.dto';
import { UpdateAvailabilityDto } from './update-availability.dto';
import { IsArray, ArrayUnique } from 'class-validator';

export class CreateOrUpdateAvailabilityDto {
  @IsArray()
  add: Array<CreateAvailabilityDto>;

  @IsArray()
  update: Array<UpdateAvailabilityDto>;

  @IsArray()
  @ArrayUnique()
  delete: Array<number>;
}
