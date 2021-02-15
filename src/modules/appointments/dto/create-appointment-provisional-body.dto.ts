import { IsNumber, IsDate } from 'class-validator';
import { IsPastDate } from '../../../utils/IsPastDate';
import { Type } from 'class-transformer';
import { IsValidForeignKey } from 'src/utils/IsValidForeignKey';
// this dto for the body comes from the request
export class CreateAppointmentProvisionalBodyDto {
  @IsNumber()
  patientId: number;

  // lookup
  @IsNumber()
  @IsValidForeignKey()
  appointmentTypeId: number;

  @IsDate()
  @Type(() => Date)
  @IsPastDate()
  date: Date;
}
