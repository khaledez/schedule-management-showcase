import { IsOptional, IsString, IsArray, Length } from 'class-validator';

export class FilterStringInputDto {
  @IsOptional()
  @IsString()
  ne: string;

  @IsOptional()
  @IsString()
  eq: string;

  @IsOptional()
  @IsString()
  le: string;

  @IsOptional()
  @IsString()
  lt: string;

  @IsOptional()
  @IsString()
  ge: string;

  @IsOptional()
  @IsString()
  gt: string;

  @IsOptional()
  @IsString()
  contains: string;

  @IsOptional()
  @IsString()
  notContains: string;

  @IsOptional()
  @IsArray()
  @Length(2)
  between: string[];

  @IsOptional()
  @IsString()
  beginsWith: string;
}
