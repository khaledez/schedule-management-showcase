import { IsNumber, IsDateString, IsBoolean } from 'class-validator';
import { ReassignAppointmentBodyDto } from './reassign-appointment-body.dto';

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
