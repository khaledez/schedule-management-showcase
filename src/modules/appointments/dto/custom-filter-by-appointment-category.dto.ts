import {
  IsOptional,
  IsString,
  IsArray,
  Length,
  IsEnum,
  isArray,
} from 'class-validator';

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
