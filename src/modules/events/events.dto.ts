import { IsISO8601, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { DateTime } from 'luxon';
import { Expose, Transform } from 'class-transformer';
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
  staffId: number;

  // here we read the key "startDate" into "_startDate", then we transform it
  // I didn't use @Transform because it gets transformed first, then validated
  @Expose({ name: 'startDate' })
  @IsISO8601({ strict: true })
  _startDate: string;

  get startDate(): Date {
    return DateTime.fromISO(this._startDate).toJSDate();
  }

  @IsOptional()
  @IsNumber()
  durationMinutes: number;

  @IsOptional()
  descriptionRich: string;
}

export class EventUpdateDto extends EventCreateDto implements EventUpdateRequest {
  @IsPositive()
  @Transform((val) => parseInt(val))
  id: number;
}
