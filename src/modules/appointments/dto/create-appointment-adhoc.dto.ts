import { Transform, Type } from 'class-transformer';
import { IsDate, IsNumber, IsString } from 'class-validator';
import { IsPastDate } from '../../../utils/IsPastDate';
// this dto for the body comes from the request
export class CreateAppointmentAdhocDto {
  @Transform((value) => Number(value))
  @IsNumber()
  patientId: number;

  @IsString()
  modeCode: string;

  @IsDate()
  @Type(() => Date)
  @IsPastDate()
  date: Date;
}
