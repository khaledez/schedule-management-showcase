import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { IsPastDate } from '../../../utils/IsPastDate';

export class featureStatusDto {
  @IsNumber()
  @Type(() => Number)
  clinicId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  doctorId: number;
}
