import { IsNumber, IsDate, IsOptional } from 'class-validator';
import { IsPastDate } from '../../../utils/IsPastDate';
import { Type, Transform } from 'class-transformer';

export class CreateNonProvisionalAppointmentDto {
  @Transform((value) => Number(value))
  @IsNumber()
  patientId: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  clinicId: number;

  @Transform((value) => Number(value))
  @IsNumber()
  availabilityId: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  createdBy: number;

  @Transform((value) => Number(value))
  @IsOptional()
  @IsNumber()
  appointmentStatusId?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @IsPastDate()
  date?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @IsPastDate()
  provisionalDate?: Date;

  @Transform((value) => Number(value))
  @IsOptional()
  @IsNumber()
  doctorId?: number;
}
