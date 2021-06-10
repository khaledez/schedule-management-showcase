import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomFilterByAppointmentCategoryDto } from './custom-filter-by-appointment-category.dto';
import { FilterDateInputDto, FilterIdsInputDto, FilterStringInputDto } from '@dashps/monmedx-common';
import { FilterTimeInputDto } from '../../../common/dtos';
// TODO: currentSprint
export class AppointmentFilterDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterDateInputDto)
  date: FilterDateInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterTimeInputDto)
  time: FilterTimeInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterIdsInputDto)
  appointmentTypeId: FilterIdsInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterStringInputDto)
  patientHealthPlanNumber: FilterStringInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterStringInputDto)
  patientFullName: FilterStringInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterIdsInputDto)
  doctorId: FilterIdsInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterIdsInputDto)
  appointmentStatusId: FilterIdsInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomFilterByAppointmentCategoryDto)
  appointmentCategory: CustomFilterByAppointmentCategoryDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AppointmentFilterDto)
  and: AppointmentFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AppointmentFilterDto)
  or: AppointmentFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AppointmentFilterDto)
  not: AppointmentFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterDateInputDto)
  dob: FilterDateInputDto;
}
