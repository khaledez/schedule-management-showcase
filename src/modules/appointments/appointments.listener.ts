import { IConfirmCompleteVisitEvent, IIdentity } from '@dashps/monmedx-common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ABORT_VISIT_EVENT_NAME,
  DEFAULT_EVENT_DURATION_MINS,
  SEQUELIZE,
  VISIT_COMPLETE_EVENT_NAME,
} from 'common/constants';
import { AppointmentStatusEnum, AppointmentVisitModeEnum, CancelRescheduleReasonCode } from 'common/enums';
import { DateTime } from 'luxon';
import { LookupsService } from 'modules/lookups/lookups.service';
import { Sequelize, Transaction } from 'sequelize';
import { AppointmentsService } from './appointments.service';

interface AbortVisitMessage {
  eventName: 'ABORT_VISIT_EVENT';
  source: string;
  patientId: number;
  clinicId: number;
  userId: number;
  data: {
    visit: {
      active: boolean;
      amended: boolean;
      appointmentId: number;
      appointmentTypeId: number;
      clinicId: number;
      createdBy: number;
      updatedBy: number;
      createdAt: Date;
      updatedAt: Date;
      modeCode: AppointmentVisitModeEnum;
      id: number;
    };
  };
}

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

      // cancel all patient future appointments including provisional
      const releaseReasonId = await this.lookupsService.getCancelRescheduleReasonByCode(
        identity,
        CancelRescheduleReasonCode.RELEASE_PATIENT,
      );
      await this.appointmentsService.cancelAllOpenAppointments(
        identity,
        patientId,
        releaseReasonId,
        'visit completed',
        transaction,
        [visitAppointmentId],
      );

      await this.appointmentsService.completeAppointment(
        identity,
        visitAppointmentId,
        visitId,
        documentId,
        transaction,
      );

      const startDateInTheDistantPast = '1988-04-20T00:00:00.000Z';
      const startDate = release ? startDateInTheDistantPast : provisionalDate;

      // create new provisional appointment
      const appointmentStatusId = release
        ? await this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.RELEASED)
        : await this.lookupsService.getProvisionalAppointmentStatusId(identity);

      const appointmentTypeId = release
        ? await this.lookupsService.getFUBAppointmentTypeId(identity)
        : provisionalTypeId;

      await this.appointmentsService.createAppointment(
        identity,
        {
          patientId,
          staffId,
          startDate,
          durationMinutes: DEFAULT_EVENT_DURATION_MINS,
          appointmentTypeId,
          appointmentStatusId,
        },
        true,
        transaction,
      );

      await transaction.commit();
    } catch (error) {
      this.logger.error({
        function: 'handleCompleteVisitEvent',
        error,
      });
      await transaction.rollback();
    }
  }

  @OnEvent(ABORT_VISIT_EVENT_NAME, { async: true })
  async handleAbortVisit(payload: AbortVisitMessage) {
    const identity: IIdentity = {
      clinicId: payload.clinicId,
      userId: payload.userId,
      cognitoId: null,
      userInfo: null,
      userLang: null,
    };
    try {
      await this.sequelizeInstance.transaction(async (transaction: Transaction) => {
        // 1. get appointment info
        const appointment = await this.appointmentsService.findOne(identity, payload.data.visit.appointmentId);

        if (!appointment) {
          this.logger.error({
            message: `cannot find appointment with id: ${payload.data?.visit?.appointmentId}`,
            payload,
          });
          return;
        }
        // 2. cancel the appointment
        const cancelReasonId = await this.lookupsService.getCancelRescheduleReasonByCode(
          identity,
          CancelRescheduleReasonCode.ABORT_VISIT,
        );
        const [cancelResult] = await this.appointmentsService.cancelAppointments(
          identity,
          [
            {
              appointmentId: payload.data.visit.appointmentId,
              keepAvailabiltySlot: false,
              cancelReasonId: cancelReasonId,
              cancelReasonText: 'visit aborted',
              visitId: payload.data.visit.id,
            },
          ],
          transaction,
        );

        if (cancelResult.status === 'FAIL') {
          this.logger.error(cancelResult.error, 'appointmentListner/handleAbortVisit');
          throw new Error(`failed to cancel appointment`);
        } else {
          this.logger.debug({
            message: 'canceled appointment after visit',
            visitId: payload.data.visit.id,
            appointmentId: payload.data.visit.appointmentId,
          });
        }
        // 3. create a provisional appointment with the same date as the cancelled appointment
        const newAppt = await this.appointmentsService.createAppointment(
          identity,
          {
            staffId: appointment.staffId,
            durationMinutes: appointment.durationMinutes,
            appointmentTypeId: payload.data.visit.appointmentTypeId,
            patientId: payload.patientId,
            startDate: DateTime.fromJSDate(appointment.startDate).toISO(), // TODO - ask Shoukri What to use in this case?
          },
          true,
          transaction,
        );

        this.logger.debug({ newAppt, message: 'created a new provisional appointment' });
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
