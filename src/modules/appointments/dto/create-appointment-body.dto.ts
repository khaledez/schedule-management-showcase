import { IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
// this dto for the body comes from the request
export class CreateAppointmentBodyDto {
  @IsNumber()
  @Transform((value) => Number(value))
  patientId: number;

  // lookup
  @IsNumber()
  @Transform((value) => Number(value))
  availabilityId: number;
}
