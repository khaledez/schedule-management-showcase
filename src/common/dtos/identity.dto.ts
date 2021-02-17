import { IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class IdentityDto {
  @Transform((value) => Number(value))
  @IsNumber()
  userId: number;

  @Transform((value) => {
    return Number(value);
  })
  @IsNumber()
  clinicId: number;

  @IsString()
  cognitoId: string;
}
