import { IsNumber, IsDate, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
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
