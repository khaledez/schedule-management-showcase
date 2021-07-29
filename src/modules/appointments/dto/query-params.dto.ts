import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Order } from 'common/enums/order.enum';
import { AppointmentFilterDto } from 'modules/appointments/dto/appointment-filter.dto';

enum Key {
  DATE,
  STATUS,
}

export class AppointmentSortDto {
  @IsOptional()
  @IsEnum(Key)
  key: string;

  @IsOptional()
  @IsEnum(Order)
  order: string;
}

export class QueryParamsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => AppointmentFilterDto)
  filter?: AppointmentFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AppointmentSortDto)
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
