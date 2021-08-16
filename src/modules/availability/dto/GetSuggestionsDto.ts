import { FilterIdsInputDto } from '@dashps/monmedx-common';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsISO8601, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { TimeGroupCode } from 'common/enums/time-group';

export class GetSuggestionsDto {
  @IsNumber()
  @Transform((val) => parseInt(val))
  @IsPositive()
  patientId: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterIdsInputDto)
  staffId?: FilterIdsInputDto;

  @IsNumber()
  @Transform((val) => parseInt(val))
  @IsPositive()
  appointmentTypeId: number;

  @IsOptional()
  @IsString()
  @IsISO8601({ strict: true })
  // @IsFutureDateTime()
  referenceDate?: string;

  @IsOptional()
  @IsEnum(TimeGroupCode)
  timeGroup?: string;
}
