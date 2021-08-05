import { IsEnum, IsOptional } from 'class-validator';
import { Order } from 'common/enums';

export enum Key {
  DATE = 'DATE',
  STATUS = 'STATUS',
  ID = 'ID',
}

export class AppointmentSortDto {
  @IsOptional()
  @IsEnum(Key)
  key: string;

  @IsOptional()
  @IsEnum(Order)
  order: string;
}
