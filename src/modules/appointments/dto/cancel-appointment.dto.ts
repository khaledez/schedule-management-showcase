import {
  IsString,
  IsNumber,
  IsDate,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// this dto after modify the dto.
export class CancelAppointmentDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  cancellationReason: string;

  @IsNumber()
  previousAppointmentId: number;

  // TODO: this should not come from the code, it should use the default value which is TRUE
  @IsBoolean()
  upcomingAppointment: boolean;

  @IsNumber()
  canceledBy: number;

  @IsDateString()
  canceledAt: Date;
}
