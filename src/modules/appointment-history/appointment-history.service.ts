import { Inject, Injectable } from '@nestjs/common';
import { APPOINTMENT_STATUS_HISTORY_REPOSITORY, SEQUELIZE } from '../../common/constants';
import { Sequelize } from 'sequelize';
import { AppointmentStatusHistoryModel } from './models/appointment-status-history.model';
import { IIdentity } from '@monmedx/monmedx-common';
import { Order } from '../../common/enums';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';
import { LookupWithCodeAttributes } from '../lookups/models';

@Injectable()
export class AppointmentHistoryService {
  constructor(
    @Inject(SEQUELIZE)
    private readonly sequelizeInstance: Sequelize,
    @Inject(APPOINTMENT_STATUS_HISTORY_REPOSITORY)
    private readonly appointmentStatusHistoryRepository: typeof AppointmentStatusHistoryModel,
  ) {}

  /**
   * Get appointment status history
   * @param identity
   * @param appointmentId
   * @param oldestFirst
   */
  async getAppointmentStatusHistoryEntries(
    identity: IIdentity,
    appointmentId: number,
    oldestFirst: boolean,
  ): Promise<AppointmentStatusHistoryEntry[]> {
    const result = await this.appointmentStatusHistoryRepository.findAll({
      include: [
        {
          model: AppointmentStatusLookupsModel,
          as: 'status',
        },
        {
          model: AppointmentStatusLookupsModel,
          as: 'previousStatus',
        },
      ],
      where: {
        clinicId: identity.clinicId,
        appointmentId,
      },
      order: [['id', oldestFirst ? Order.ASC : Order.DESC]],
    });
    return result.map((appointmentStatusHistory) => toAppointmentStatusHistoryEntry(appointmentStatusHistory));
  }
}

function toAppointmentStatusHistoryEntry(
  appointmentStatusHistory: AppointmentStatusHistoryModel,
): AppointmentStatusHistoryEntry {
  return {
    createdBy: appointmentStatusHistory.createdBy,
    status: appointmentStatusHistory.status,
    previousStatus: appointmentStatusHistory.previousStatus,
    createdAt: appointmentStatusHistory.createdAt,
  };
}

export interface AppointmentStatusHistoryEntry {
  createdBy: number;
  createdAt: Date;
  status: LookupWithCodeAttributes;
  previousStatus?: LookupWithCodeAttributes;
}
