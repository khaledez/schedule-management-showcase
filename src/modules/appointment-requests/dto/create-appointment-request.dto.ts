import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { IsPastDate } from '../../../utils/IsPastDate';

export class CreateAppointmentRequestDto {
  @IsNumber()
  @Type(() => Number)
  clinicId: number;

  @IsNumber()
  @Type(() => Number)
  patientId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  doctorId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  originalAppointmentId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  timeGroupId: number;

  @IsNumber()
  @Type(() => Number)
  appointmentVisitModeId: number;

  @IsOptional()
  complaints: string;

  @IsOptional()
  requestReason: string;

  @IsDate()
  @Type(() => Date)
  @IsPastDate()
  date: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  time: Date;
}
