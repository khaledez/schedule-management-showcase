import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

// this dto for the body comes from the request
export class CreateAppointmentBodyDto {
  @IsNumber()
  patient_id: number;
  // lookup
  @IsNumber()
  type_id: number;

  @IsString()
  @IsDateString()
  provisional_date: Date;

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
  clinic_notes: string;
}

// this dto after modify the dto.
export class CreateAppointmentDto extends CreateAppointmentBodyDto {
  @IsNumber()
  clinic_id: number;

  @IsNumber()
  created_by: number;
}
