import { IsString, IsNumber } from 'class-validator';

// this dto for the body comes from the request
export class ChangeDoctorAppointmentBodyDto {
  @IsNumber()
  doctorId: number;

  @IsString()
  reasonMessage: string;
}
