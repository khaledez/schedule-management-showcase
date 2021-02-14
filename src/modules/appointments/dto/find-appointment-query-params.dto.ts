import {
  IsString,
  IsMilitaryTime,
  IsDate,
  IsOptional,
  Matches,
  ValidateNested,
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
  appointmentTypeIds: number[];

  @IsOptional()
  @Matches(/^[\d+,?]+$/)
  appointmentStatusIds: number[];

  @IsOptional()
  @Matches(/^[\d+,?]+$/)
  doctorIds: number[];

  @IsOptional()
  @Matches(/^[\d+,?]+$/)
  ids: number[];

  @IsOptional()
  filter: any;
}
