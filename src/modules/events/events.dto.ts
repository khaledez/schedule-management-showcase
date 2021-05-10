import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EventCreateRequest, EventUpdateRequest, Invitee } from './events.interfaces';

export class EventCreateDto implements EventCreateRequest {
  @IsOptional()
  title: string;

  @IsOptional()
  invitees: Invitee[];

  @IsOptional()
  location: string;

  @IsOptional()
  colorCode: string;

  @IsNumber()
  @Transform((val) => parseInt(val))
  staffId: number;

  @IsOptional()
  @Type(() => Date)
  date: Date;

  @IsOptional()
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @IsNumber()
  @Transform((val) => parseInt(val))
  durationMinutes: number;

  @IsOptional()
  descriptionRich: string;
}

export class EventUpdateDto extends EventCreateDto implements EventUpdateRequest {
  @IsPositive()
  @Transform((val) => parseInt(val))
  id: number;
}
