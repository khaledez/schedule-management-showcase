import { IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryParamsDto {
  @IsOptional()
  @Transform((value) => JSON.parse(value))
  filter: any;

  // TODO: create dto for the filters
  @IsOptional()
  @Transform((value) => JSON.parse(value))
  sort: any;

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
