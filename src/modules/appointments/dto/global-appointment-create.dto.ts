import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional } from 'class-validator';
import { IsPastDate } from '../../../utils/IsPastDate';

// this dto after modify the dto.
/**
 * @deprecated
 */
export class CreateGlobalAppointmentDto {
  @Transform((value) => Number(value))
  @IsNumber()
  patientId: number;

  @Transform((value) => Number(value))
  @IsNumber()
  @IsOptional()
  clinicId: number;

  @IsNumber()
  @IsOptional()
  @Transform((value) => Number(value))
  createdBy: number;

  @Transform((value) => Number(value))
  @IsOptional()
  @IsNumber()
  appointmentStatusId?: number;

  @Transform((value) => Number(value))
  @IsOptional()
  @IsNumber()
  appointmentTypeId?: number;

  @Transform((value) => Number(value))
  @IsOptional()
  @IsNumber()
  provisionalTypeId?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @IsPastDate()
  date?: Date;

  @IsOptional()
  @Type(() => Number)
  durationMinutes?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @IsPastDate()
  provisionalDate?: Date;

  @Transform((value) => Number(value))
  @IsOptional()
  @IsNumber()
  availabilityId?: number;

  @Transform((value) => Number(value))
  @IsOptional()
  @IsNumber()
  doctorId?: number;

  @IsOptional()
  @IsBoolean()
  upcomingAppointment?: boolean;
}
