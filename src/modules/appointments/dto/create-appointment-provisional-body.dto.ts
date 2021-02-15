import { IsNumber, IsDate } from 'class-validator';
import { IsPastDate } from '../../../utils/IsPastDate';
import { Type, Transform } from 'class-transformer';
// this dto for the body comes from the request
export class CreateAppointmentProvisionalBodyDto {
  @Transform(({ value }) => {
    return Number(value);
  })
  @IsNumber()
  patientId: number;

  // lookup
  @Transform(({ value }) => {
    return Number(value);
  })
  @IsNumber()
  // @IsValidForeignKey()
  appointmentTypeId: number;

  @IsDate()
  @Type(() => Date)
  @IsPastDate()
  date: Date;
}
