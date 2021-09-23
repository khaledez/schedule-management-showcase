import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class AppointmentRequestCancelAppointmentDto {
  @IsNumber()
  @Type(() => Number)
  appointmentId: number;

  @IsOptional()
  cancelReason: string;
}
