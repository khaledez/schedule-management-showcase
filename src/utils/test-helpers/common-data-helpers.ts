import { IIdentity, UserTypeEnum } from '@monmedx/monmedx-common';

export function getTestIdentity(userId, clinicId): IIdentity {
  return {
    userId,
    clinicId,
    cognitoId: null,
    userLang: null,
    userInfo: {
      cognitoId: null,
      status: null,
      userId: userId,
      clinicIds: [clinicId],
      username: null,
      userType: UserTypeEnum.STAFF,
      firstName: null,
      lastName: null,
      languageCode: null,
      clinics: [],
      patientIds: [userId],
    },
  };
}

export function getPatientTestIdentity(userId, clinicId): IIdentity {
  const patientIdentity = getTestIdentity(userId, clinicId);
  patientIdentity.userInfo.userType = UserTypeEnum.PATIENT;
  return patientIdentity;
}
