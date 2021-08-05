import { Type } from 'class-transformer';
import { IsBoolean, IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsNumber()
  @Type(() => Number)
  appointmentId: number;
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  staffId: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  staffChangedPermanent: boolean;

  @IsOptional()
  @IsISO8601({ strict: true })
  startDate: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  durationMinutes: number;

  @IsNumber()
  @Type(() => Number)
  rescheduleReason: number;

  @IsOptional()
  @IsString()
  rescheduleText: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  keepAvailabilitySlot: boolean;

  @IsOptional()
  @IsISO8601()
  @Type(() => Date)
  provisionalDate: Date;
}
