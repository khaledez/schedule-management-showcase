import { FilterIdsInputDto, FilterStringInputDto } from '@dashps/monmedx-common';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { FilterDateInputDto } from '../../common/dtos';
import { CalendarSearchInput } from './calendar.interface';

export class CalendarSearchDto implements CalendarSearchInput {
  @IsOptional()
  @Type(() => FilterStringInputDto)
  entryType: FilterStringInputDto;

  @IsOptional()
  @Type(() => FilterDateInputDto)
  dateRange: FilterDateInputDto;

  @IsOptional()
  @Type(() => FilterIdsInputDto)
  staffId: FilterIdsInputDto;

  @IsOptional()
  @Type(() => FilterIdsInputDto)
  appointmentTypeId: FilterIdsInputDto;

  @IsOptional()
  @Type(() => FilterIdsInputDto)
  appointmentStatusId: FilterIdsInputDto;

  @IsOptional()
  @Type(() => Number)
  maxDayCount: number;
}

export class CalendarSearchBodyDto {
  @Type(() => CalendarSearchDto)
  @ValidateNested()
  @IsObject()
  filter: CalendarSearchDto;
}
