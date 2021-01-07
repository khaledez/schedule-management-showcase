import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

// this dto for the body comes from the request
export class ExtendAppointmentBodyDto {
  @IsString()
  @IsDateString()
  provisional_date: Date;

  @IsNumber()
  reason_message: number;
}

// this dto after modify the dto.
export class ExtendAppointmentDto extends ExtendAppointmentBodyDto {
  @IsString()
  date_extension_reason: string;

  @IsNumber()
  old_appointment_id: number;

  @IsNumber()
  updated_by: number;

  @IsDateString()
  updated_at: Date;
}
