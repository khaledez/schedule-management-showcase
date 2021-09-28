import { FilterIdsInputDto, FilterStringInputDto } from '@monmedx/monmedx-common';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { FilterDateInputDto } from '../../common/dtos';
import { CalendarSearchInput } from './calendar.interface';
import { HasOne } from '../../common/decorators/has-one';

export class CalendarSearchDto implements CalendarSearchInput {
  @IsOptional()
  @Type(() => FilterStringInputDto)
  entryType: FilterStringInputDto;

  @IsOptional()
  @Type(() => FilterDateInputDto)
  dateRange: FilterDateInputDto;

  @IsOptional()
  @Type(() => FilterDateInputDto)
  @HasOne(['between'])
  dateTimeRange?: FilterDateInputDto;

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
