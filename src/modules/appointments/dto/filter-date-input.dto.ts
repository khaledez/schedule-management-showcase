import { IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FilterDateInputDto {
  @IsOptional()
  @Type(() => Date)
  ne: Date;

  @IsOptional()
  @Type(() => Date)
  eq: Date;

  @IsOptional()
  @Type(() => Date)
  lt: Date;

  @IsOptional()
  @Type(() => Date)
  gt: Date;

  @IsOptional()
  @Type(() => Date)
  ge: Date;

  @IsOptional()
  @Transform((value) => value.map((ele) => new Date(ele)))
  between: Date[];
}
