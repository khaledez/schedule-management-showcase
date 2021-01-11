import {
  IsString,
  IsNumber,
  IsDate,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// this dto for the body comes from the request
export class ReassignAppointmentBodyDto {
  @IsNumber()
  doctor_id: number;
}

// this dto after modify the dto.
export class ReassignAppointmentDto extends ReassignAppointmentBodyDto {
  @IsNumber()
  prev_appointment_id: number;

  // TODO: this should not come from the code, it should use the default value which is TRUE
  @IsBoolean()
  upcoming_appointment: boolean;

  @IsNumber()
  updated_by: number;

  @IsDateString()
  updated_at: Date;
}
