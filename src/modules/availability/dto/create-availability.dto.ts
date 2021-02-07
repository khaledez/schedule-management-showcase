import { Type } from 'class-transformer';
import {
  IsNumber,
  IsDate,
  IsString,
  IsMilitaryTime,
  IsOptional,
} from 'class-validator';

export class CreateAvailabilityDto {
  @IsNumber()
  @IsOptional()
  id: number;

  @IsNumber()
  doctorId: number;

  @IsNumber()
  createdBy: number;

  @IsNumber()
  clinicId: number;

  @IsString()
  @IsMilitaryTime()
  startTime: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNumber()
  durationMinutes: number;

  @IsNumber()
  appointmentTypeId: number;
}
