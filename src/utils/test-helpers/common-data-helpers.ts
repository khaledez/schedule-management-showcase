import { IIdentity } from '@monmedx/monmedx-common';

export function getTestIdentity(userId, clinicId): IIdentity {
  return {
    userId,
    clinicId,
    cognitoId: null,
    userLang: null,
    userInfo: {
      cognitoId: null,
      status: null,
      userId: null,
      clinicIds: [clinicId],
      username: null,
      userType: null,
      firstName: null,
      lastName: null,
      languageCode: null,
      clinics: [],
      patientIds: [],
    },
  };
}
