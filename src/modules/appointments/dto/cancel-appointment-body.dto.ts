import { IsString, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// this dto for the body comes from the request
export class CancelAppointmentBodyDto {
  @IsDate()
  @Type(() => Date)
  provisionalDate: Date;

  @IsString()
  reasonMessage: string;

  @IsBoolean()
  isRemoveAvailabilitySlot: boolean;
}
