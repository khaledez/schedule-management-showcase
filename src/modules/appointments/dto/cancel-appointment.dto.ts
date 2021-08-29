import { Type } from 'class-transformer';
import { IsBoolean, IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

// this dto after modify the dto.
export class CancelAppointmentDto {
  @IsNumber()
  @Type(() => Number)
  appointmentId: number;

  @IsISO8601()
  provisionalDate?: string;

  @IsString()
  cancelReasonText: string;

  @IsNumber()
  @Type(() => Number)
  cancelReasonId: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  keepAvailabiltySlot: boolean;

  @IsOptional()
  @Type(() => Number)
  visitId?: number;
}
