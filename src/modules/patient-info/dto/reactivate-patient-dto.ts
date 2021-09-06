import { Transform, Type } from 'class-transformer';
import { IsDate, IsISO8601, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class ReactivatePatientDto {
  @Transform((value) => Number(value))
  @IsNumber()
  @IsPositive()
  patientId: number;

  @IsDate()
  @Type(() => Date)
  provisionalDate: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
