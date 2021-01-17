import { Type } from 'class-transformer';
import { IsNumber, IsDate, IsString, IsMilitaryTime } from 'class-validator';

export class CreateAvailabilityDto {
  @IsNumber()
  doctor_id: number;

  @IsNumber()
  created_by: number;

  @IsNumber()
  clinic_id: number;

  @IsString()
  @IsMilitaryTime()
  start_time: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNumber()
  duration_minutes: number;

  @IsNumber()
  appointment_type_id: number;
}
