import { IIdentity } from '@dashps/monmedx-common';

export function getTestIdentity(userId, clinicId): IIdentity {
  return {
    userId,
    clinicId,
    cognitoId: null,
    userLang: null,
    userInfo: null,
  };
}
