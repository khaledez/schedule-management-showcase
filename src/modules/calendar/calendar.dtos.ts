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
}

export class CalendarSearchBodyDto {
  @Type(() => CalendarSearchDto)
  @ValidateNested()
  @IsObject()
  filter: CalendarSearchDto;
}
