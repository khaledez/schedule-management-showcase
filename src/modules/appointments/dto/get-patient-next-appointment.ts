import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class GetPatientNextAppointment {
  @Transform((value) => Number(value))
  @IsNumber()
  appointmentId: number;
  @Transform((value) => Number(value))
  @IsNumber()
  patientId: number;
}
