import { IsNumber, IsDate } from 'class-validator';
import { IsPastDate } from '../../../utils/IsPastDate';
import { Type } from 'class-transformer';
// this dto for the body comes from the request
export class CreateAppointmentBodyDto {
  @IsNumber()
  patientId: number;

  // lookup
  @IsNumber()
  appointmentTypeId: number;

  @IsDate()
  @Type(() => Date)
  @IsPastDate()
  date: Date;

  // lookup
  @IsNumber()
  appointmentStatusId: number;
}
