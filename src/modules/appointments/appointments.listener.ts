import { IConfirmCompleteVisitEvent } from '@dashps/monmedx-common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Sequelize, Transaction } from 'sequelize';
import { SEQUELIZE, VISIT_COMPLETE_EVENT_NAME } from '../../common/constants';
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
            appointment: { id: visitAppointmentId },
          },
        },
      } = payload;

      const identity = { clinicId, userId };

      await this.appointmentsService.completeAppointment(visitAppointmentId, identity, transaction);

      const cancelPatientAppointments = () => {
        // cancel all patient future appointments including provisional
        return this.appointmentsService.cancelPatientAppointments(
          patientId,
          {
            cancelRescheduleReasonRn: 'Release patient after complete visit',
            cancelRescheduleReasonFr: 'Release patient after complete visit',
          },
          transaction,
        );
      };

      if (release) {
        await cancelPatientAppointments();
      } else if (provisionalTypeId && provisionalDate) {
        await cancelPatientAppointments();

        // create new provisional appointment
        await this.appointmentsService.createProvisionalAppointment(
          {
            patientId,
            clinicId,
            doctorId: staffId,
            createdBy: userId,
            date: new Date(provisionalDate),
            provisionalDate: new Date(provisionalDate),
            provisionalTypeId,
            appointmentTypeId: provisionalTypeId,
            upcomingAppointment: true,
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
