import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class featureStatusDto {
  @IsNumber()
  @Type(() => Number)
  clinicId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  doctorId: number;
}
