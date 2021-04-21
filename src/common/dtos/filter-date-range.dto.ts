import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

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
  @Type(() => Date)
  between: Date[];
}
