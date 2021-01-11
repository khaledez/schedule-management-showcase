import { IsString, IsNumber, IsOptional, IsDate } from 'class-validator';
import { IsPastDate } from '../../../utils/IsPastDate';
import { Type } from 'class-transformer';
// this dto for the body comes from the request
export class CreateAppointmentBodyDto {
  @IsNumber()
  patient_id: number;
  // lookup
  @IsNumber()
  type_id: number;

  @IsDate()
  @Type(() => Date)
  @IsPastDate()
  date: Date;

  // lookup
  @IsNumber()
  priority_id: number;

  // lookup
  @IsNumber()
  status_id: number;

  @IsString()
  @IsOptional()
  complains: string;

  @IsString()
  @IsOptional()
  clinical_notes: string;
}

// this dto after modify the dto.
export class CreateAppointmentDto extends CreateAppointmentBodyDto {
  @IsNumber()
  clinic_id: number;

  @IsNumber()
  created_by: number;
}
