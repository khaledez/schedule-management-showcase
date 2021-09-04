import { FilterDateInputDto, FilterIdsInputDto, FilterStringInputDto } from '@monmedx/monmedx-common';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { FilterTimeInputDto } from '../../../common/dtos';

enum AppointmentCategoryKeys {
  WAITLIST,
  APPOINTMENT,
  ALL,
}

export class CustomFilterByAppointmentCategoryDto {
  @IsOptional()
  @IsString()
  @IsEnum(AppointmentCategoryKeys)
  ne: string;

  @IsOptional()
  @IsString()
  @IsEnum(AppointmentCategoryKeys)
  eq: string;

  @IsOptional()
  @IsArray()
  @IsEnum(AppointmentCategoryKeys, { each: true })
  in: AppointmentCategoryKeys[];
}

export class AppointmentFilterDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterDateInputDto)
  date?: FilterDateInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterTimeInputDto)
  time?: FilterTimeInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterIdsInputDto)
  appointmentTypeId?: FilterIdsInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterStringInputDto)
  patientHealthPlanNumber?: FilterStringInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterStringInputDto)
  patientFullName?: FilterStringInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterIdsInputDto)
  patientDoctorId?: FilterIdsInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterIdsInputDto)
  doctorId?: FilterIdsInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterIdsInputDto)
  appointmentStatusId?: FilterIdsInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomFilterByAppointmentCategoryDto)
  appointmentCategory?: CustomFilterByAppointmentCategoryDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AppointmentFilterDto)
  and?: AppointmentFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AppointmentFilterDto)
  or?: AppointmentFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AppointmentFilterDto)
  not?: AppointmentFilterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterDateInputDto)
  dob?: FilterDateInputDto;
}
