import {
  IsString,
  IsNumber,
  IsDate,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// this dto for the body comes from the request
export class ReassignAppointmentBodyDto {
  @IsNumber()
  doctorId: number;
}

// this dto after modify the dto.
export class ReassignAppointmentDto extends ReassignAppointmentBodyDto {
  @IsNumber()
  prevAppointmentId: number;

  // TODO: this should not come from the code, it should use the default value which is TRUE
  @IsBoolean()
  upcomingAppointment: boolean;

  @IsNumber()
  updatedBy: number;

  @IsDateString()
  updatedAt: Date;
}
