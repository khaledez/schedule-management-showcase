import { FilterIdsInputDto, FilterStringInputDto } from '@dashps/monmedx-common';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { FilterDateInputDto, FilterAvailabilityInputDto } from '../../common/dtos';
import { CalendarSearchInput } from './calendar.interface';

export class CalendarSearchDto implements CalendarSearchInput {
  @IsOptional()
  @Type(() => FilterStringInputDto)
  entryType: FilterStringInputDto;

  @IsOptional()
  @Type(() => FilterDateInputDto)
  dateRange: FilterDateInputDto;

  @IsOptional()
  timezoneId: string;

  @IsNotEmpty()
  @Type(() => FilterIdsInputDto)
  staffId: FilterIdsInputDto;

  @IsOptional()
  @Type(() => FilterAvailabilityInputDto)
  availabilityFilter: FilterAvailabilityInputDto;
}

export class CalendarSearchBodyDto {
  @Type(() => CalendarSearchDto)
  @ValidateNested()
  @IsObject()
  filter: CalendarSearchDto;
}
