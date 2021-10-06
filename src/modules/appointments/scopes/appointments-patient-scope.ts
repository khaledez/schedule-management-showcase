import { IIdentity } from '@monmedx/monmedx-common';
import { Op } from 'sequelize';
import { PatientInfoModel } from '../../patient-info/patient-info.model';
import { AppointmentTypesLookupsModel } from '../../lookups/models/appointment-types.model';
import { AppointmentStatusLookupsModel } from '../../lookups/models/appointment-status.model';
import { AppointmentVisitModeLookupModel } from '../../lookups/models/appointment-visit-mode.model';
import { AppointmentRequestsModel } from '../../appointment-requests/models';
import { AppointmentCancelRescheduleReasonLookupModel } from '../../lookups/models/appointment-cancel-reschedule-reason.model';

export const AppointmentsPatientScope = (identity: IIdentity) => {
  const { clinicIds, patientIds } = identity.userInfo;
  return {
    where: { clinicId: { [Op.in]: clinicIds }, deletedAt: null, deletedBy: null, patientId: { [Op.in]: patientIds } },
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
        model: AppointmentCancelRescheduleReasonLookupModel,
        required: false,
      },
    ],
    attributes: {
      exclude: [
        'availability',
        'deletedAt',
        'deletedBy',
        'updatedAt',
        'updatedBy',
        'createdAt',
        'createdBy',
        'canceledAt',
        'canceledBy',
        'availabilityId',
        'entryType',
        'provisionalDate',
        'actualStartDate',
        'actualEndDate',
        'visitId',
      ],
    },
  };
};
