import { IsString, IsNumber, IsDateString, IsBoolean } from 'class-validator';

// this dto after modify the dto.
export class ChangeDoctorAppointmentDto {
  @IsNumber()
  doctorId: number;

  @IsString()
  doctorReassignmentReason: string;

  @IsNumber()
  prevAppointmentId: number;

  @IsNumber()
  updatedBy: number;

  // TODO: this should not come from the code, it should use the default value which is TRUE
  @IsBoolean()
  upcomingAppointment: boolean;

  @IsDateString()
  updatedAt: Date;
}
