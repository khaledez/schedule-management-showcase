import { Type } from 'class-transformer';
import { IsArray, IsNumber } from 'class-validator';

export class DeleteTemplateDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  ids: number[];
}
