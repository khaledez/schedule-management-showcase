import { IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

// this dto for the body comes from the request
export class ExtendAppointmentBodyDto {
  @IsDate()
  @Type(() => Date)
  provisionalDate: Date;

  @IsString()
  reasonMessage: string;
}
