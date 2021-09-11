import { Type } from 'class-transformer';
import { IsBoolean, IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsNumber()
  @Type(() => Number)
  appointmentId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  staffId?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  staffChangedPermanent?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  removeFutureAppointments?: boolean;

  @IsOptional()
  @IsISO8601({ strict: true })
  startDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  rescheduleReason?: number;

  @IsOptional()
  @IsString()
  rescheduleText?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  keepAvailabilitySlot?: boolean;

  @IsOptional()
  @IsISO8601()
  provisionalDate?: string;

  @IsOptional()
  @Type(() => Number)
  availabilityId?: number;

  @IsOptional()
  @Type(() => Number)
  appointmentTypeId?: number;

  @IsOptional()
  @Type(() => Number)
  appointmentVisitModeId?: number;
}
