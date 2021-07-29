import { Type } from 'class-transformer';
import { IsMilitaryTime, IsNumber, IsOptional } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsMilitaryTime({ message: 'Must be a valid representation of time in format HH:MM or HH:MM:SS' })
  startTime: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  durationMinutes: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  appointmentTypeId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  appointmentVisitModeId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  statusappointmentStatusId: number;

  @IsOptional()
  complaintsNotes: string;
}
