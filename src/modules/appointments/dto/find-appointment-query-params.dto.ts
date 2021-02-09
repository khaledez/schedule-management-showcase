import {
  IsString,
  IsMilitaryTime,
  IsDate,
  IsOptional,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindAppointmentsQueryParams {
  @IsOptional()
  @IsString()
  patientFullName: string;

  @IsOptional()
  @IsString()
  patientPrimaryHealthPlanNumber: string;

  @IsString()
  @IsOptional()
  @IsMilitaryTime()
  timeFrom: string;

  @IsString()
  @IsOptional()
  @IsMilitaryTime()
  timeTo: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateFrom: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateTo: string;

  @IsOptional()
  @Matches(/^[\d+,?]+$/)
  appointmentTypeIds: Array<string>;

  @IsOptional()
  @Matches(/^[\d+,?]+$/)
  appointmentStatusIds: number[];

  @IsOptional()
  @Matches(/^[\d+,?]+$/)
  doctorIds: number[];

}