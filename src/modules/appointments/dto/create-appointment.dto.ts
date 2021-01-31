import { IsString, IsNumber, IsOptional, IsDate } from 'class-validator';
import { IsPastDate } from '../../../utils/IsPastDate';
import { Type } from 'class-transformer';
// this dto for the body comes from the request
export class CreateAppointmentBodyDto {
  @IsNumber()
  patient_id: number;

  @IsNumber()
  clinic_id: number;
  // lookup
  @IsNumber()
  appointment_type_id: number;

  @IsDate()
  @Type(() => Date)
  @IsPastDate()
  date: Date;

  @IsDate()
  @Type(() => Date)
  @IsPastDate()
  provisional_date: Date;

  // lookup
  @IsNumber()
  appointment_status_id: number;
}

// this dto after modify the dto.
export class CreateAppointmentDto extends CreateAppointmentBodyDto {
  @IsNumber()
  clinic_id: number;

  @IsNumber()
  created_by: number;
}
