import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class RescheduleAppointmentRequestDto {
  @IsNumber()
  @Type(() => Number)
  clinicId: number;

  @IsNumber()
  @Type(() => Number)
  patientId: number;

  @IsNumber()
  @Type(() => Number)
  originalAppointmentId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  timeGroupId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  appointmentVisitModeId: number;

  @IsOptional()
  complaints: string;

  @IsOptional()
  requestReason: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  time: Date;
}
