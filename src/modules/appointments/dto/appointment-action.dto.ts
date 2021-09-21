import { Type } from 'class-transformer';
import { IsEnum, IsNumber } from 'class-validator';
import { AppointmentActionEnum, AppointmentStatusEnum } from 'common/enums';

export class AppointmentActionDto {
  @IsNumber()
  @Type(() => Number)
  appointmentId: number;

  @IsEnum(AppointmentActionEnum)
  actionType: AppointmentActionEnum & AppointmentStatusEnum;
}
