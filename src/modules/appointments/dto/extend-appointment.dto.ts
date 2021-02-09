import {
  IsString,
  IsNumber,
  IsDate,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// this dto after modify the dto.
export class ExtendAppointmentDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  dateExtensionReason: string;

  @IsNumber()
  previousAppointmentId: number;

  @IsNumber()
  updatedBy: number;

  // TODO: this should not come from the code, it should use the default value which is TRUE
  @IsBoolean()
  upcomingAppointment: boolean;

  @IsDateString()
  updatedAt: Date;
}
