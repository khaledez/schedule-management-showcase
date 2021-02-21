import { IsOptional, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FilterDateInputDto } from './filter-date-input.dto';
import { FilterStringInputDto } from './filter-string-input.dto';
import { FilterIdsInputDto } from './filter-ids-input.dto';
import { CustomFilterByAppointmentCategoryDto } from './custom-filter-by-appointment-category.dto';
// TODO: currentSprint
export class AppointmentFilterDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterDateInputDto)
  date: FilterDateInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterDateInputDto)
  time: FilterDateInputDto;

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

  // @IsOptional()
  // @ValidateNested()
  // @Type(() => FilterIdsInputDto)
  // availabilityId: FilterIdsInputDto;
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
}
