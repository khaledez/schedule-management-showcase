import { IsNumber, IsOptional, IsString, IsISO8601 } from 'class-validator';

export class CreateAvailabilityDto {
  @IsNumber()
  @IsOptional()
  id: number;

  @IsNumber()
  staffId: number;

  @IsString()
  @IsISO8601({ strict: true })
  startDate: string;

  @IsNumber()
  durationMinutes: number;

  @IsNumber()
  appointmentTypeId: number;
}
