import { Transform, Type } from 'class-transformer';
import { IsDate, IsISO8601, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CreateProvisionalAppointmentDto {
  @Transform((value) => Number(value))
  @IsNumber()
  @IsPositive()
  patientId: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  @IsPositive()
  staffId?: number;

  // lookup
  @Transform((value) => Number(value))
  @IsNumber()
  @IsPositive()
  appointmentTypeId: number;

  @IsDate()
  @Type(() => Date)
  @IsISO8601()
  startDate: Date;

  @Transform((value) => Number(value))
  @IsNumber()
  @IsPositive()
  durationMinutes: number;

  @IsOptional()
  complaintsNotes?: string;
}
