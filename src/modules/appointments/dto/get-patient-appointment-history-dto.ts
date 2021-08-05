import { IsNumber, IsOptional, IsPositive, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AppointmentSortDto } from 'modules/appointments/dto/appointment-sort-dto';

export class GetPatientAppointmentHistoryDto {
  @IsPositive()
  @Transform((value) => Number(value))
  @IsNumber()
  patientId: number;

  @IsOptional()
  @IsPositive()
  @Transform((value) => Number(value))
  @IsNumber()
  first?: number;

  @IsOptional()
  @IsPositive()
  @Transform((value) => Number(value))
  @IsNumber()
  last?: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  after?: number;

  @IsOptional()
  @Transform((value) => Number(value))
  @IsNumber()
  before?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => AppointmentSortDto)
  sort?: AppointmentSortDto[];
}
