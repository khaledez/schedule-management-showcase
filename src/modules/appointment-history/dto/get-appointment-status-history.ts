import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetAppointmentStatusHistory {
  @IsOptional()
  @Transform((it) => {
    return it === 'true' || it === '1';
  })
  oldestFirst?: boolean;
}
