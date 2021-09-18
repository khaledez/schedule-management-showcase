import { Inject, Injectable } from '@nestjs/common';
import { APPOINTMENT_STATUS_HISTORY_REPOSITORY, SEQUELIZE } from '../../common/constants';
import { Sequelize } from 'sequelize';
import { AppointmentStatusHistoryModel } from './models/appointment-status-history.model';
import { IIdentity } from '@monmedx/monmedx-common';
import { Order } from '../../common/enums';
import { AppointmentStatusLookupsModel } from '../lookups/models/appointment-status.model';

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
    nameEn: appointmentStatusHistory.status.nameEn,
    nameFr: appointmentStatusHistory.status.nameFr,
    code: appointmentStatusHistory.status.code,
    createdAt: appointmentStatusHistory.createdAt,
  };
}

export interface AppointmentStatusHistoryEntry {
  createdBy: number;
  nameEn: string;
  nameFr: string;
  code: string;
  createdAt: Date;
}
