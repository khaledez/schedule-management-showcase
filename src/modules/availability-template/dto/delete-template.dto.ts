import { Type } from 'class-transformer';
import { IsArray } from 'class-validator';

export class DeleteTemplateDto {
  @IsArray({ each: true })
  @Type(() => Number)
  ids: number[];
}
