import {
  IsOptional,
  IsArray,
  IsMilitaryTime,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class FilterTimeInputDto {
  @IsOptional()
  @IsMilitaryTime()
  ne: string;

  @IsOptional()
  @IsMilitaryTime()
  eq: string;

  @IsOptional()
  @IsMilitaryTime()
  lt: string;

  @IsOptional()
  @IsMilitaryTime()
  gt: string;

  @IsOptional()
  @IsMilitaryTime()
  ge: string;

  @IsOptional()
  @IsMilitaryTime({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsArray()
  between: string[];
}
