import { Transform } from 'class-transformer';
import { IsOptional, IsArray, Length, IsNumber } from 'class-validator';

export class FilterIdsInputDto {
  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  ne: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  eq: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  le: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  lt: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  ge: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  gt: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  contains: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  notContains: number;

  @IsOptional()
  @Transform((value) => value.map((ele) => Number(ele)))
  @IsArray()
  @Length(2)
  between: number[];

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  beginsWith: number;

  @IsOptional()
  @Transform((value) => value.map((ele) => Number(ele)))
  @IsArray()
  in: number[];
}
