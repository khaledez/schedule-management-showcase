import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { AppointmentVisitModeEnum } from 'common/enums';

export class AdhocAppointmentDto {
  @IsNumber()
  @Type(() => Number)
  patientId: number;

  @IsOptional()
  @IsEnum(AppointmentVisitModeEnum)
  modeCode: AppointmentVisitModeEnum;

  @IsDate()
  @Type(() => Date)
  date: Date;
}
