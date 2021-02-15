import { IsDate, IsArray, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';

// this dto for the body comes from the request
export class QueryAppointmentsByPeriodsDto {
  @IsDate()
  @Type(() => Date)
  fromDate: Date;

  @IsDate()
  @Type(() => Date)
  toDate: Date;

  @IsOptional()
  @IsArray()
  @Transform((value) => JSON.parse(value).map((ele) => ~~ele))
  doctorIds: any;
}
