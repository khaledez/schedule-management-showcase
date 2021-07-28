import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { AppointmentFilterDto } from '../../modules/appointments/dto/appointment-filter.dto';
import { AppointmentSortDto } from '../../modules/appointments/dto/appointment-sort.dto';

export class QueryParamsDto {
  @IsOptional()
  filter?: AppointmentFilterDto;

  @IsOptional()
  sort?: AppointmentSortDto[];

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  first?: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  last?: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  after?: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  before?: number;
}
