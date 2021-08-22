import { IConfirmCompleteVisitEvent, IIdentity } from '@dashps/monmedx-common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ABORT_VISIT_EVENT_NAME,
  DEFAULT_EVENT_DURATION_MINS,
  SEQUELIZE,
  VISIT_COMPLETE_EVENT_NAME,
} from 'common/constants';
import { AppointmentVisitModeEnum, CancelRescheduleReasonCode } from 'common/enums';
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
        CancelRescheduleReasonCode.RELEASE,
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
      const appointmentStatusId = await this.lookupsService.getProvisionalAppointmentStatusId(identity);
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
    await this.sequelizeInstance.transaction(async (transaction: Transaction) => {
      // 1. cancel the appointment
      const cancelReasonId = await this.lookupsService.getCancelRescheduleReasonByCode(
        identity,
        CancelRescheduleReasonCode.ABORT_VISIT,
      );
      // TODO - Do we need a provisional date?
      const [cancelResult] = await this.appointmentsService.cancelAppointments(
        identity,
        [
          {
            appointmentId: payload.data.visit.appointmentId,
            keepAvailabiltySlot: false,
            reasonId: cancelReasonId,
            reasonText: 'visit aborted',
            visitId: payload.data.visit.id,
          },
        ],
        transaction,
      );

      if (cancelResult.status === 'FAIL') {
        this.logger.error(cancelResult.error, 'appointmentListner/handleAbortVisit');
      } else {
        this.logger.debug({
          message: 'canceled appointment after visit',
          visitId: payload.data.visit.id,
          appointmentId: payload.data.visit.appointmentId,
        });
      }
      // 2. TODO create a new appointment with release? -- check with Shoukri
    });
  }
}
