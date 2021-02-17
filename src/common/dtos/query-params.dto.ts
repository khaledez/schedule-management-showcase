import { IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryParamsDto {
  // TODO: create dto for the filters
  @IsOptional()
  filter: any;

  // TODO: create dto for the filters
  @IsOptional()
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
