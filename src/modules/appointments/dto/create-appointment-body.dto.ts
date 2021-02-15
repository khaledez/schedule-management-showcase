import { IsNumber } from 'class-validator';
// this dto for the body comes from the request
export class CreateAppointmentBodyDto {
  @IsNumber()
  patientId: number;

  // lookup
  @IsNumber()
  availabilityId: number;
}
