import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsISO8601, IsNumber, IsOptional } from 'class-validator';
// this dto for the body comes from the request
export class CreateAppointmentDto {
  /* Base attributes */
  @IsNumber()
  @Transform((value) => parseInt(value))
  patientId: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  staffId?: number;

  /* Optional Attributes */
  @IsOptional()
  @IsNumber()
  @Transform((val) => parseInt(val))
  appointmentTypeId?: number;

  /* Defaults to IN_PERSON */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  appointmentVisitModeId?: number;

  /* Defaults to provisional (WAIT_LIST) if not provided*/
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  appointmentStatusId?: number;

  /* Populate with newly created availabilty if id not provided */
  @IsOptional()
  @IsNumber()
  @Transform((value) => parseInt(value))
  availabilityId?: number;

  /* If availability id is not provided */
  @IsOptional()
  @IsISO8601({ strict: true })
  startDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  durationMinutes?: number;

  @IsOptional()
  complaintsNotes?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  staffChangedPermanent?: boolean;

  @IsOptional()
  @IsNumber()
  @Transform((value) => parseInt(value))
  previousAppointmentId?: number;
}
