import { Type } from 'class-transformer';
import { IsBoolean, IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

// this dto after modify the dto.
export class CancelAppointmentDto {
  @IsNumber()
  @Type(() => Number)
  appointmentId: number;

  @IsISO8601()
  provisionalDate: string;

  @IsString()
  reasonText: string;

  @IsNumber()
  @Type(() => Number)
  reasonId: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  keepAvailabiltySlot: boolean;
}
