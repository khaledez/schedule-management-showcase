import { IIdentity } from '@monmedx/monmedx-common';
import { PatientInfoModel } from '../../patient-info/patient-info.model';
import { AppointmentTypesLookupsModel } from '../../lookups/models/appointment-types.model';
import { AppointmentStatusLookupsModel } from '../../lookups/models/appointment-status.model';
import { AppointmentVisitModeLookupModel } from '../../lookups/models/appointment-visit-mode.model';
import { AppointmentRequestsModel } from '../../appointment-requests/models';
import { AvailabilityModel } from '../../availability/models/availability.model';
import { AppointmentCancelRescheduleReasonLookupModel } from '../../lookups/models/appointment-cancel-reschedule-reason.model';

export const StaffPatientScope = (identity: IIdentity) => {
  return {
    where: { clinicId: identity.clinicId },
    include: [
      {
        model: PatientInfoModel,
        required: false,
      },
      {
        model: AppointmentTypesLookupsModel,
        required: false,
      },
      {
        model: AppointmentStatusLookupsModel,
        required: false,
      },
      {
        model: AppointmentVisitModeLookupModel,
        required: false,
      },
      {
        model: AppointmentRequestsModel,
        required: false,
      },
      {
        model: AvailabilityModel,
        required: false,
      },
      {
        model: AppointmentCancelRescheduleReasonLookupModel,
        required: false,
      },
    ],
  };
};
