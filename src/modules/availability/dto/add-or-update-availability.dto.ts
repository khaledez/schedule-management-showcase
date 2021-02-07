import { CreateAvailabilityDto } from './create-availability.dto';
import { IsArray, ArrayUnique, IsNumber, IsOptional } from 'class-validator';

export class CreateOrUpdateAvailabilityDto {
  @IsArray()
  @IsOptional()
  create: Array<CreateAvailabilityDto>;

  // the reason for adding underscore is delete keyword is reserved in js
  @IsArray()
  @ArrayUnique()
  @IsOptional()
  _delete: Array<number>;

  @IsNumber()
  userId: number;

  @IsNumber()
  clinicId: number;
}
