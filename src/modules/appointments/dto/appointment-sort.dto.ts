import { IsEnum, IsOptional } from 'class-validator';
import { Order } from 'common/enums/order.enum';

enum Key {
  DATE,
  STATUS,
}

export class AppointmentSortDto {
  @IsOptional()
  @IsEnum(Key)
  key: string;

  @IsOptional()
  @IsEnum(Order)
  order: string;
}
