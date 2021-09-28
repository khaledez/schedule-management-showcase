import { IIdentity, UserTypeEnum } from '@monmedx/monmedx-common';
import { AppointmentsPatientScope } from './appointments-patient-scope';
import { StaffPatientScope } from './appointments-staff-scope';

export const AppointmentsRoleScope: any = (identity: IIdentity) => {
  if (identity.userInfo?.userType === UserTypeEnum.PATIENT) {
    return AppointmentsPatientScope(identity);
  }
  return StaffPatientScope(identity);
};
