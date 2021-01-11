import {
  IsString,
  IsNumber,
  IsDate,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// this dto for the body comes from the request
export class CancelAppointmentBodyDto {
  @IsDate()
  @Type(() => Date)
  provisional_date: Date;

  @IsString()
  reason_message: string;

  @IsBoolean()
  is_remove_availability_slot: boolean;
}

// this dto after modify the dto.
export class CancelAppointmentDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  cancellation_reason: string;

  @IsNumber()
  prev_appointment_id: number;

  // TODO: this should not come from the code, it should use the default value which is TRUE
  @IsBoolean()
  upcoming_appointment: boolean;

  @IsNumber()
  deleted_by: number;

  @IsDateString()
  deleted_at: Date;
}
