import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAppointmentRequestDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  timeGroupId: number;

  @IsNumber()
  @Type(() => Number)
  appointmentVisitModeId: number;

  @IsOptional()
  complaints: string;

  @IsOptional()
  requestReason: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  time: Date;
}
