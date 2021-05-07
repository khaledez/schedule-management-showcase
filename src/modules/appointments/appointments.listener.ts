import { IConfirmCompleteEvent } from '@dashps/monmedx-common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Sequelize, Transaction } from 'sequelize';
import { SEQUELIZE, VISIT_COMPLETE_EVENT_NAME } from 'src/common/constants';
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
  async handleCompleteVisitEvent(payload: IConfirmCompleteEvent) {
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
          upcomingAppointment: { id: upcomingAppointmentId, typeId: provisionalTypeId, date: provisionalDate },
          visit: {
            appointment: { id: visitAppointmentId },
          },
        },
      } = payload;

      const identity = { clinicId, userId };

      const promiseActions: any[] = [
        this.appointmentsService.completeAppointment(visitAppointmentId, identity, transaction),
      ];

      if (upcomingAppointmentId) {
        promiseActions.push(
          this.appointmentsService.patchAppointment(upcomingAppointmentId, { upcomingAppointment: true }, transaction),
        );

        await Promise.all(promiseActions);
      } else {
        // cancel all patient future appointments including provisional
        promiseActions.push(
          this.appointmentsService.cancelPatientAppointments(
            visitAppointmentId,
            {
              cancelRescheduleReasonRn: 'Release patient after complete visit',
              cancelRescheduleReasonFr: 'Release patient after complete visit',
            },
            transaction,
          ),
        );

        await Promise.all(promiseActions);

        if (provisionalTypeId && provisionalDate) {
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
            },
            transaction,
          );
        }
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
