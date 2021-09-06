import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AppointmentRequestCancelAppointmentDto {
  @IsNumber()
  @Type(() => Number)
  appointmentId: number;

  @IsOptional()
  cancelReason: string;
}
