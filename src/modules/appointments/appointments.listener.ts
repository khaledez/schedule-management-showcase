import { IConfirmCompleteVisitEvent, IIdentity } from '@dashps/monmedx-common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DEFAULT_EVENT_DURATION_MINS, SEQUELIZE, VISIT_COMPLETE_EVENT_NAME } from 'common/constants';
import { CancelRescheduleReasonCode } from 'common/enums';
import { Sequelize, Transaction } from 'sequelize';
import { AppointmentsService } from './appointments.service';

@Injectable()
export class AppointmentsListener {
  private readonly logger = new Logger(AppointmentsListener.name);

  constructor(
    @Inject(SEQUELIZE)
    private readonly sequelizeInstance: Sequelize,
    private readonly appointmentsService: AppointmentsService,
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
          upcomingAppointment: { id: upcomingAppointmentId, typeId: provisionalTypeId, date: provisionalDate, release },
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

      const cancelPatientAppointments = () => {
        // cancel all patient future appointments including provisional
        return this.appointmentsService.cancelPatientInCompleteAppointments(
          patientId,
          CancelRescheduleReasonCode.RELEASE,
          transaction,
        );
      };

      if (release) {
        await cancelPatientAppointments();
      } else if (provisionalTypeId && provisionalDate) {
        await cancelPatientAppointments();

        // create new provisional appointment
        await this.appointmentsService.createAppointment(
          identity,
          {
            patientId,
            staffId,
            startDate: provisionalDate,
            durationMinutes: DEFAULT_EVENT_DURATION_MINS,
            appointmentTypeId: provisionalTypeId,
          },
          transaction,
        );
      }

      if (upcomingAppointmentId) {
        // TODO this logic need to be reviewed when we finally refactor this shitty service
        // update to upcoming appointment
        await this.appointmentsService.patchAppointment(
          upcomingAppointmentId,
          { upcomingAppointment: true },
          transaction,
        );
      }

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
