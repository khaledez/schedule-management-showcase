import { Matches, IsOptional } from 'class-validator';

export class QueryFindAvailabilityDto {
  @IsOptional()
  @Matches(/^[\d+,?]+$/)
  ids: string;
}
