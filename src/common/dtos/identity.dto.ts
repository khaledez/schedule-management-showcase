import { IsString, IsNumber } from 'class-validator';

export class IdentityDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  clinicId: number;

  @IsString()
  cognitoId: string;
}
