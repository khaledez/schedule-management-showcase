import { IsNumber, IsDate } from 'class-validator';
import { IsPastDate } from '../../../utils/IsPastDate';
import { Type } from 'class-transformer';
import { CreateAppointmentBodyDto } from './create-appointment-body.dto';

// this dto after modify the dto.
export class CreateAppointmentDto extends CreateAppointmentBodyDto {
  @IsNumber()
  clinicId: number;

  @IsNumber()
  createdBy: number;

  @IsDate()
  @Type(() => Date)
  @IsPastDate()
  provisionalDate: Date;
}
