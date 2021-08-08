import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

// this dto after modify the dto.
export class UpComingAppointmentQueryDto {
  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  after: number;
}
