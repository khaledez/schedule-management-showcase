import { CreateAvailabilityDto } from './create-availability.dto';
import {
  IsArray,
  ArrayUnique,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { IdentityDto } from '../../../common/dtos/identity.dto';

export class CreateOrUpdateAvailabilityDto {
  @IsArray()
  @IsOptional()
  create: Array<CreateAvailabilityDto>;

  // the reason for adding underscore is delete keyword is reserved in js
  @IsArray()
  @ArrayUnique()
  @IsOptional()
  remove: Array<number>;

  @ValidateNested()
  identity: IdentityDto;
}
