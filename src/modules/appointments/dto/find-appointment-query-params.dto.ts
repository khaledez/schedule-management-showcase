import {
  IsString,
  IsMilitaryTime,
  IsDate,
  IsOptional,
  Matches,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FindAppointmentsQueryParams {
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
