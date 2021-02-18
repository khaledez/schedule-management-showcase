import { IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AppointmentFilterDto } from '../../modules/appointments/dto/appointment-filter.dto';
import { AppointmentSortDto } from '../../modules/appointments/dto/appointment-sort.dto';

export class QueryParamsDto {
  @IsOptional()
  @Transform((value) => JSON.parse(value))
  filter: AppointmentFilterDto;

  @IsOptional()
  @Transform((value) => JSON.parse(value))
  sort: AppointmentSortDto[];

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  first: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  last: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  after: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  before: number;
}
