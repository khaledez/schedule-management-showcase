import { IsISO8601, IsNumber, IsString } from 'class-validator';

export class UpdateAvailabilityDto {
  @IsNumber()
  id: number;

  @IsString()
  @IsISO8601({ strict: true })
  startDate: string;

  @IsNumber()
  durationMinutes: number;

  @IsNumber()
  appointmentTypeId: number;
}
