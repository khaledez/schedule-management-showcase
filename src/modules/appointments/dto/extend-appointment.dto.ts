import { IsString, IsNumber, IsDate, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// this dto for the body comes from the request
export class ExtendAppointmentBodyDto {
  @IsDate()
  @Type(() => Date)
  provisional_date: Date;

  @IsString()
  reason_message: string;
}

// this dto after modify the dto.
export class ExtendAppointmentDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  date_extension_reason: string;

  @IsNumber()
  prev_appointment_id: number;

  @IsNumber()
  updated_by: number;

  // TODO: this should not come from the code, it should use the default value which is TRUE 
  @IsBoolean()
  upcoming_appointment: boolean

  @IsDateString()
  updated_at: Date;
}
