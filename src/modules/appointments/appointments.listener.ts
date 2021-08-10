import { IConfirmCompleteVisitEvent, IIdentity } from '@dashps/monmedx-common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DEFAULT_EVENT_DURATION_MINS, SEQUELIZE, VISIT_COMPLETE_EVENT_NAME } from 'common/constants';
import { AppointmentStatusEnum, CancelRescheduleReasonCode } from 'common/enums';
import { Sequelize, Transaction } from 'sequelize';
import { AppointmentsService } from './appointments.service';
import { LookupsService } from 'modules/lookups/lookups.service';

@Injectable()
export class AppointmentsListener {
  private readonly logger = new Logger(AppointmentsListener.name);

  constructor(
    @Inject(SEQUELIZE)
    private readonly sequelizeInstance: Sequelize,
    private readonly appointmentsService: AppointmentsService,
    private readonly lookupsService: LookupsService,
  ) {}

  @OnEvent(VISIT_COMPLETE_EVENT_NAME, { async: true })
  async handleCompleteVisitEvent(payload: IConfirmCompleteVisitEvent) {
    this.logger.log({
      function: 'handleCompleteVisitEvent',
      payload,
    });

    const transaction: Transaction = await this.sequelizeInstance.transaction();

    try {
      const {
        clinicId,
        staffId,
        userId,
        data: {
          patient: { id: patientId },
          upcomingAppointment: { typeId: provisionalTypeId, date: provisionalDate, release },
          visit: {
            id: visitId,
            documentId: documentId,
            appointment: { id: visitAppointmentId },
          },
        },
      } = payload;

      const identity: IIdentity = { clinicId, userId, cognitoId: null, userInfo: null, userLang: null };

      await this.appointmentsService.completeAppointment(
        visitAppointmentId,
        visitId,
        documentId,
        identity,
        transaction,
      );

      // cancel all patient future appointments including provisional
      await this.appointmentsService.cancelPatientInCompleteAppointments(
        patientId,
        CancelRescheduleReasonCode.RELEASE,
        transaction,
      );

      const startDateInTheDistantPast = '1988-04-20T00:00:00.000Z';
      const startDate = release ? startDateInTheDistantPast : provisionalDate;

      // create new provisional appointment
      const appointmentStatusId = await this.lookupsService.getStatusIdByCode(AppointmentStatusEnum.WAIT_LIST);
      await this.appointmentsService.createAppointment(
        identity,
        {
          patientId,
          staffId,
          startDate,
          durationMinutes: DEFAULT_EVENT_DURATION_MINS,
          appointmentTypeId: provisionalTypeId,
          appointmentStatusId,
        },
        true,
        transaction,
      );

      transaction.commit();
    } catch (error) {
      this.logger.error({
        function: 'handleCompleteVisitEvent',
        error,
      });
      transaction.rollback();
    }
  }
}
