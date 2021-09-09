import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class RejectAppointmentRequestDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  rejectionReason: string;
}
