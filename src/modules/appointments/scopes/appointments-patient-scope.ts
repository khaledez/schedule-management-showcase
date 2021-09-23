import { IIdentity, UserTypeEnum } from '@monmedx/monmedx-common';
import { Op } from 'sequelize';
import { AvailabilityModel } from '../../availability/models/availability.model';
import { AppointmentCancelRescheduleReasonLookupModel } from '../../lookups/models/appointment-cancel-reschedule-reason.model';

export const AppointmentsPatientScope = (identity: IIdentity) => {
  const { clinicIds, userType, patientIds } = identity.userInfo;
  if (userType === UserTypeEnum.PATIENT) {
    return {
      where: { clinicId: { [Op.in]: clinicIds }, deletedAt: null, deletedBy: null, patientId: { [Op.in]: patientIds } },
      include: [
        {
          model: AvailabilityModel,
          required: false,
          where: { id: { [Op.gt]: 18_446_744_073_709_551_615 } },
        },
        {
          model: AppointmentCancelRescheduleReasonLookupModel,
          required: false,
          where: { id: { [Op.gt]: 18_446_744_073_709_551_615 } },
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
          'cancelRescheduleText',
          'cancelRescheduleReasonId',
          'cancelRescheduleReason',
          'appointmentTypeId',
          'appointmentStatusId',
          'appointmentVisitModeId',
          'actualStartDate',
          'actualEndDate',
          'visitSummaryDocumentId',
          'visitId',
        ],
      },
    };
  }
  return {};
};
