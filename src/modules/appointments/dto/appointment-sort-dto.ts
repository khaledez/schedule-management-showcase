import { IsEnum, IsOptional } from 'class-validator';
import { Order } from 'common/enums';

export enum Key {
  DATE = 'DATE',
  UPDATED_AT = 'UPDATED_AT',
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
