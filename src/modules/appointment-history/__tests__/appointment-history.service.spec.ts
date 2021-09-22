import { Test, TestingModule } from '@nestjs/testing';
import {
  APPOINTMENT_REQUEST_FEATURE_REPOSITORY,
  APPOINTMENT_REQUEST_REPOSITORY,
  APPOINTMENTS_REPOSITORY,
  AVAILABILITY_REPOSITORY,
} from 'common/constants';
import { AvailabilityService } from 'modules/availability/availability.service';
import { ConfigurationModule } from 'modules/config/config.module';
import { DatabaseModule } from 'modules/database/database.module';
import { LookupsModule } from 'modules/lookups/lookups.module';
import { LookupsService } from 'modules/lookups/lookups.service';
import { getTestIdentity } from 'utils/test-helpers/common-data-helpers';
import { EventsModule } from '../../events/events.module';
import { PatientInfoService } from '../../patient-info';
import { AvailabilityModel } from '../../availability/models/availability.model';
import { AvailabilityValidator } from '../../availability/availability.validator';
import { AppointmentsService } from '../../appointments/appointments.service';
import { AppointmentEventPublisher } from '../../appointments/appointments.event-publisher';
import { AppointmentsModel } from '../../appointments/appointments.model';
import { AppointmentHistoryModule } from '../appointment-history.module';
import { AppointmentHistoryService } from '../appointment-history.service';
import { AppointmentStatusEnum } from '../../../common/enums';
import { AppointmentStatusHistoryModel } from '../models/appointment-status-history.model';
import { AppointmentRequestFeatureStatusModel, AppointmentRequestsModel } from '../../appointment-requests/models';
import { AppointmentRequestsService } from '../../appointment-requests/appointment-requests.service';

describe('# Appointment status history', () => {
  const identity = getTestIdentity(25, 25);
  let testingModule: TestingModule;
  let appointmentHistoryService: AppointmentHistoryService;
  let appointmentsService: AppointmentsService;
  let lookupService: LookupsService;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule, AppointmentHistoryModule, LookupsModule, EventsModule],
      providers: [
        { provide: APPOINTMENTS_REPOSITORY, useValue: AppointmentsModel },
        { provide: AVAILABILITY_REPOSITORY, useValue: AvailabilityModel },
        { provide: 'PatientInfoService', useValue: {} },
        { provide: 'AppointmentsService', useClass: AppointmentsService },
        { provide: 'AvailabilityService', useClass: AvailabilityService },
        { provide: APPOINTMENT_REQUEST_REPOSITORY, useValue: AppointmentRequestsModel },
        { provide: APPOINTMENT_REQUEST_FEATURE_REPOSITORY, useValue: AppointmentRequestFeatureStatusModel },
        AvailabilityValidator,
        AppointmentEventPublisher,
        AppointmentRequestsService,
      ],
    }).compile();
    appointmentHistoryService = await testingModule.get<AppointmentHistoryService>(AppointmentHistoryService);
    appointmentsService = await testingModule.get<AppointmentsService>(AppointmentsService);
    lookupService = await testingModule.get<LookupsService>(LookupsService);
  });

  test('Services are created successfully', () => {
    expect(appointmentHistoryService).toBeDefined();
    expect(appointmentsService).toBeDefined();
    expect(lookupService).toBeDefined();
  });

  afterAll(async () => {
    await Promise.all([
      AppointmentStatusHistoryModel.destroy({ where: {} }),
      AvailabilityModel.destroy({ where: {} }),
      AppointmentsModel.destroy({ where: {} }),
    ]);
    await testingModule.close();
  });

  test('# Schedule appointment - update - complete', async () => {
    const scheduleStatusId = await lookupService.getStatusIdByCode(identity, AppointmentStatusEnum.SCHEDULE);
    const readyStatusId = await lookupService.getStatusIdByCode(identity, AppointmentStatusEnum.READY);
    const confirmStatusId = await lookupService.getStatusIdByCode(identity, AppointmentStatusEnum.CONFIRM1);
    const expectedStatusOrder = [
      AppointmentStatusEnum.COMPLETE,
      AppointmentStatusEnum.CONFIRM1,
      AppointmentStatusEnum.READY,
      AppointmentStatusEnum.SCHEDULE,
    ];
    const expectedPreviousStatusOrder = [
      AppointmentStatusEnum.CONFIRM1,
      AppointmentStatusEnum.READY,
      AppointmentStatusEnum.SCHEDULE,
      null,
    ];
    const appointment = await appointmentsService.createAppointment(
      identity,
      {
        patientId: 64,
        staffId: 65,
        appointmentStatusId: scheduleStatusId,
        startDate: '2021-10-25T07:43:40.084Z',
        durationMinutes: 20,
        appointmentTypeId: await lookupService.getFUBAppointmentTypeId(identity),
      },
      true,
    );

    await appointmentsService.updateAppointment(identity, appointment.id, {
      appointmentStatusId: readyStatusId,
    });
    await appointmentsService.updateAppointment(identity, appointment.id, {
      appointmentStatusId: confirmStatusId,
    });
    await appointmentsService.completeAppointment(identity, appointment.id, 1, '1', null);

    const statusHistory = await appointmentHistoryService.getAppointmentStatusHistoryEntries(
      identity,
      appointment.id,
      false,
    );
    expect(statusHistory.map((statusEntry) => statusEntry.status.code)).toEqual(expectedStatusOrder);
    expect(statusHistory.map((statusEntry) => statusEntry.previousStatus?.code ?? null)).toEqual(
      expectedPreviousStatusOrder,
    );

    const reversedStatusHistory = await appointmentHistoryService.getAppointmentStatusHistoryEntries(
      identity,
      appointment.id,
      true,
    );
    expect(reversedStatusHistory.map((statusEntry) => statusEntry.status.code)).toEqual(expectedStatusOrder.reverse());
    expect(reversedStatusHistory.map((statusEntry) => statusEntry.previousStatus?.code ?? null)).toEqual(
      expectedPreviousStatusOrder.reverse(),
    );
  });
});
