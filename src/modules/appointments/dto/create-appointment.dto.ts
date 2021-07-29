import { Transform, Type } from 'class-transformer';
import { IsISO8601, IsNumber, IsOptional } from 'class-validator';
// this dto for the body comes from the request
export class CreateAppointmentDto {
  @IsNumber()
  @Transform((value) => parseInt(value))
  patientId: number;

  @IsOptional()
  @IsNumber()
  @Transform((value) => parseInt(value))
  availabilityId: number;

  @IsNumber()
  @Transform((val) => parseInt(val))
  appointmentTypeId: number;

  @IsNumber()
  @Type(() => Number)
  staffId: number;

  @IsOptional()
  @IsISO8601({ strict: true })
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  durationMinutes: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  appointmentVisitModeId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  appointmentStatusId: number;
}
