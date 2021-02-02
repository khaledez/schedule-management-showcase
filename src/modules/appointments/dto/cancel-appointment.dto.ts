import {
  IsString,
  IsNumber,
  IsDate,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// this dto for the body comes from the request
export class CancelAppointmentBodyDto {
  @IsDate()
  @Type(() => Date)
  provisionalDate: Date;

  @IsString()
  reasonMessage: string;

  @IsBoolean()
  isRemoveAvailabilitySlot: boolean;
}

// this dto after modify the dto.
export class CancelAppointmentDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  cancellationReason: string;

  @IsNumber()
  prevAppointmentId: number;

  // TODO: this should not come from the code, it should use the default value which is TRUE
  @IsBoolean()
  upcomingAppointment: boolean;

  @IsNumber()
  canceledBy: number;

  @IsDateString()
  canceledAt: Date;
}
