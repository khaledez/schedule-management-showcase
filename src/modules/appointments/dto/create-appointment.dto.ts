import { IsString, IsNumber, IsOptional, IsDate } from 'class-validator';
import { IsPastDate } from '../../../utils/IsPastDate';
import { Type } from 'class-transformer';
// this dto for the body comes from the request
export class CreateAppointmentBodyDto {
  @IsNumber()
  patientId: number;

  // lookup
  @IsNumber()
  appointmentTypeId: number;

  @IsDate()
  @Type(() => Date)
  @IsPastDate()
  date: Date;

  // lookup
  @IsNumber()
  appointmentStatusId: number;
}

// this dto after modify the dto.
export class CreateAppointmentDto extends CreateAppointmentBodyDto {
  @IsNumber()
  clinicId: number;

  @IsNumber()
  createdBy: number;

  @IsDate()
  @Type(() => Date)
  @IsPastDate()
  provisionalDate: Date;
}
