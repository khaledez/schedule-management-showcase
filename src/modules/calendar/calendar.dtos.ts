import { FilterIdsInputDto, FilterStringInputDto } from '@mon-medic/common';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { FilterDateInputDto, FilterAvailabilityInputDto } from 'src/common/dtos';
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
