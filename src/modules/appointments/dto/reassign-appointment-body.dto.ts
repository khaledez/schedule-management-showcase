import { IsNumber } from 'class-validator';

// this dto for the body comes from the request
export class ReassignAppointmentBodyDto {
  @IsNumber()
  doctorId: number;
}
