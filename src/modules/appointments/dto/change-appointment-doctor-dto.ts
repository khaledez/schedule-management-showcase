import { Type } from 'class-transformer';
import { IsISO8601, IsNumber, IsOptional } from 'class-validator';

export class ChangeAppointmentDoctorDto {
  @IsNumber()
  @Type(() => Number)
  patientId: number;

  @IsNumber()
  @Type(() => Number)
  doctorId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  appointmentTypeId?: number;

  @IsOptional()
  @IsISO8601()
  provisionalDate?: string;

  @IsOptional()
  @Type(() => Number)
  appointmentStatusId?: number;
}
