import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';

// this dto after modify the dto.
export class CancelAppointmentDto {
  @IsDate()
  @Type(() => Date)
  provisionalDate: Date;

  @IsString()
  reasonText: string;

  @IsNumber()
  reasonId: number;

  @IsBoolean()
  keepAvailabiltySlot: boolean;
}
