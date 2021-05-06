import { IsNumber, IsDate, IsOptional } from 'class-validator';
import { IsPastDate } from '../../../utils/IsPastDate';
import { Type, Transform } from 'class-transformer';

// this dto after modify the dto.
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
}
