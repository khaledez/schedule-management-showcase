import { IsNumber, IsDate, IsOptional } from 'class-validator';
import { IsPastDate } from '../../../utils/IsPastDate';
import { Type, Transform } from 'class-transformer';

export class CreateNonProvisionalAppointmentDto {
  @Transform((value) => Number(value))
  @IsNumber()
  patientId: number;

  @Transform((value) => Number(value))
  clinicId: number;

  @Transform((value) => Number(value))
  @IsNumber()
  availabilityId: number;

  @Transform((value) => Number(value))
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
