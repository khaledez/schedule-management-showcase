import { IsString, IsNumber, IsDate, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

// this dto for the body comes from the request
export class ExtendAppointmentBodyDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNumber()
  reason_message: number;
}

// this dto after modify the dto.
export class ExtendAppointmentDto extends ExtendAppointmentBodyDto {
  @IsString()
  date_extension_reason: string;

  @IsNumber()
  prev_appointment_id: number;

  @IsNumber()
  updated_by: number;

  @IsDateString()
  updated_at: Date;
}
