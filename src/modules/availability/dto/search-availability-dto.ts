import { Type } from 'class-transformer';
import { FilterDateInputDto, FilterIdsInputDto } from '@monmedx/monmedx-common';
import { IsEnum, IsNotEmptyObject, IsOptional } from 'class-validator';
import { TimeGroupCode } from 'common/enums/time-group';
import { HasOne } from 'common/decorators/has-one';

export class SearchAvailabilityDto {
  @Type(() => FilterDateInputDto)
  @IsNotEmptyObject()
  @HasOne(['eq', 'between'])
  @IsOptional()
  dateRange?: FilterDateInputDto;

  @Type(() => FilterDateInputDto)
  @IsNotEmptyObject()
  @HasOne(['between'])
  @IsOptional()
  dateTimeRange?: FilterDateInputDto;

  @IsOptional()
  @Type(() => FilterIdsInputDto)
  @HasOne(['eq', 'in'])
  staffId?: FilterIdsInputDto;

  @IsOptional()
  @Type(() => FilterIdsInputDto)
  @HasOne(['eq', 'in'])
  appointmentTypeId?: FilterIdsInputDto;

  @IsOptional()
  @IsEnum(TimeGroupCode)
  timeGroup?: string;
}
