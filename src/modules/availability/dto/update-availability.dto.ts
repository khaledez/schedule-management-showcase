import { CreateAvailabilityDto } from './create-availability.dto';
import { IsNumber } from 'class-validator';

export class UpdateAvailabilityDto extends CreateAvailabilityDto {
  @IsNumber()
  id: number;
}
