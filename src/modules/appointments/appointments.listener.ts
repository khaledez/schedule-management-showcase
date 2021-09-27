import { IConfirmCompleteVisitEvent, IIdentity } from '@monmedx/monmedx-common';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ABORT_VISIT_EVENT_NAME,
  DEFAULT_EVENT_DURATION_MINS,
  SEQUELIZE,
  VISIT_COMPLETE_EVENT_NAME,
} from 'common/constants';
import { AppointmentVisitModeEnum, CancelRescheduleReasonCode } from 'common/enums';
import { DateTime } from 'luxon';
import { LookupsService } from 'modules/lookups/lookups.service';
import { Sequelize, Transaction } from 'sequelize';
import { AppointmentsService } from './appointments.service';
import { PatientInfoService } from '../patient-info';

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
    @Inject(forwardRef(() => PatientInfoService))
    private readonly patientInfoService: PatientInfoService,
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
          upcomingAppointment: { typeId: appointmentTypeId, date: startDate, release },
          visit: {
            id: visitId,
            documentId: documentId,
            appointment: { id: appointmentId, typeId: visitAppointmentTypeId, startDate: visitAppointmentStartDate },
          },
        },
      } = payload;
      await this.completeVisitFlow(
        clinicId,
        staffId,
        userId,
        patientId,
        appointmentId,
        visitId,
        documentId,
        appointmentTypeId ?? visitAppointmentTypeId,
        startDate ?? visitAppointmentStartDate.toISOString(),
        release,
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
        // 2. cancel the appointment
        const cancelReasonId = await this.lookupsService.getCancelRescheduleReasonByCode(
          identity,
          CancelRescheduleReasonCode.ABORT_VISIT,
        );
        await this.appointmentsService.cancelPatientAppointments(
          identity,
          payload.patientId,
          cancelReasonId,
          'visit aborted',
          true,
          payload.data.visit.id,
          transaction,
        );
        // 3. create a provisional appointment with the same date as the cancelled appointment
        const newAppt = await this.appointmentsService.createAppointment(
          identity,
          {
            staffId: appointment.staffId,
            durationMinutes: appointment.durationMinutes,
            appointmentTypeId: payload.data.visit.appointmentTypeId,
            patientId: payload.patientId,
            startDate: DateTime.fromJSDate(appointment.startDate).toISO(),
          },
          true,
          transaction,
        );

        this.logger.debug({ newAppt, message: 'created a new provisional appointment' });
      });
    } catch (error) {
      this.logger.error('appointmentListener/abortVisit failure');
      this.logger.error(error);
    }
  }

  /**
   * Will complete the visit flow, the appointment in progress will be changed to completed
   * And depending on {link @release} flag, it will either create a provisional appointment or release the patient
   */
  async completeVisitFlow(
    clinicId: number,
    staffId: number,
    userId: number,
    patientId: number,
    appointmentId: number,
    visitId: number,
    documentId: string,
    appointmentTypeId: number,
    startDate: string,
    release: boolean,
    transaction: Transaction,
  ) {
    const identity: IIdentity = { clinicId, userId, cognitoId: null, userInfo: null, userLang: null };

    // cancel all patient future appointments including provisional
    const releaseReasonId = await this.lookupsService.getCancelRescheduleReasonByCode(
      identity,
      CancelRescheduleReasonCode.RELEASE_PATIENT,
    );
    await this.appointmentsService.cancelPatientAppointments(
      identity,
      patientId,
      releaseReasonId,
      'visit completed',
      true,
      null,
      transaction,
    );

    await this.appointmentsService.completeAppointment(identity, appointmentId, visitId, documentId, transaction);

    if (release) {
      await this.patientInfoService.releasePatient(clinicId, patientId);
      await this.appointmentsService.createReleasedAppointment(identity, patientId, staffId, new Date(), transaction);
    } else {
      await this.appointmentsService.createAppointment(
        identity,
        {
          patientId,
          staffId,
          startDate,
          durationMinutes: DEFAULT_EVENT_DURATION_MINS,
          appointmentTypeId,
          appointmentStatusId: await this.lookupsService.getProvisionalAppointmentStatusId(identity),
        },
        true,
        transaction,
      );
    }
  }
}
