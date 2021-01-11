import { IsString, IsNumber, IsDateString, IsBoolean } from 'class-validator';

// this dto for the body comes from the request
export class ChangeDoctorAppointmentBodyDto {
  @IsNumber()
  doctor_id: number;

  @IsString()
  reason_message: string;
}

// this dto after modify the dto.
export class ChangeDoctorAppointmentDto {
  @IsNumber()
  doctor_id: number;

  @IsString()
  doctor_reassignment_reason: string;

  @IsNumber()
  prev_appointment_id: number;

  @IsNumber()
  updated_by: number;

  // TODO: this should not come from the code, it should use the default value which is TRUE
  @IsBoolean()
  upcoming_appointment: boolean;

  @IsDateString()
  updated_at: Date;
}
