import { IsNumber, IsDate, IsOptional } from 'class-validator';
import { IsPastDate } from '../../../utils/IsPastDate';
import { Type } from 'class-transformer';

// this dto after modify the dto.
export class CreateGlobalAppointmentDto {
  @IsNumber()
  patientId: number;

  @IsNumber()
  clinicId: number;

  @IsNumber()
  @IsOptional()
  createdBy: number;

  @IsOptional()
  @IsNumber()
  appointmentStatusId?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @IsPastDate()
  provisionalDate?: Date;

  @IsOptional()
  @IsNumber()
  availabilityId?: number;

  @IsOptional()
  @IsNumber()
  doctorId?: number;
}
