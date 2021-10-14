import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { AppointmentActionEnum, AppointmentStatusEnum } from 'common/enums';

export class AppointmentPublicActionDto {
  @IsNumber()
  @Type(() => Number)
  appointmentId: number;

  @IsString()
  appointmentToken: string;

  @IsEnum(AppointmentActionEnum)
  actionType: AppointmentActionEnum & AppointmentStatusEnum;
}
