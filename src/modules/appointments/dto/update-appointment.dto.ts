import { Type } from 'class-transformer';
import { IsISO8601, IsNumber, IsOptional } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  appointmentTypeId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  appointmentVisitModeId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  appointmentStatusId?: number;

  @IsOptional()
  complaintsNotes?: string;
}
