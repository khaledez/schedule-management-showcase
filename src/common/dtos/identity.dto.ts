import { IIdentity, IUser } from '@dashps/monmedx-common';
import { Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class IdentityDto implements IIdentity {
  userLang: string;
  userInfo: IUser;
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
