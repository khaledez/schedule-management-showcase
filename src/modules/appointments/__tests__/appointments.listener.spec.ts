import { HttpModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize';
import {
  APPOINTMENT_CRON_JOB_REPOSITORY,
  APPOINTMENT_REQUEST_FEATURE_REPOSITORY,
  APPOINTMENT_REQUEST_REPOSITORY,
  APPOINTMENTS_REPOSITORY,
  AVAILABILITY_REPOSITORY,
  PATIENT_INFO_REPOSITORY,
  SEQUELIZE,
} from '../../../common/constants';
import { AppointmentStatusEnum } from '../../../common/enums';
import { PatientStatus } from '../../../common/enums/patient-status';
import { getTestIdentity } from '../../../utils/test-helpers/common-data-helpers';
import { AppointmentCronJobModel } from '../../appointment-cron-job/appointment-cron-job.model';
import { AppointmentCronJobService } from '../../appointment-cron-job/appointment-cron-job.service';
import { AppointmentRequestsService } from '../../appointment-requests/appointment-requests.service';
import { AppointmentRequestFeatureStatusModel, AppointmentRequestsModel } from '../../appointment-requests/models';
import { AvailabilityService } from '../../availability/availability.service';
import { AvailabilityValidator } from '../../availability/availability.validator';
import { AvailabilityModel } from '../../availability/models/availability.model';
import { ClinicSettingsModule } from '../../clinic-settings/clinic-settings.module';
import { ConfigurationModule } from '../../config/config.module';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { LookupsModule } from '../../lookups/lookups.module';
import { LookupsService } from '../../lookups/lookups.service';
import { AppointmentStatusLookupsModel } from '../../lookups/models/appointment-status.model';
import { PatientInfoService } from '../../patient-info';
import { PatientInfoModel } from '../../patient-info/patient-info.model';
import { AppointmentEventPublisher } from '../appointments.event-publisher';
import { AppointmentsListener } from '../appointments.listener';
import { AppointmentsModel } from '../appointments.model';
import { AppointmentsService } from '../appointments.service';
import {
  buildICompleteVisitEventKeepOriginalAppointment,
  buildIConfirmCompleteVisitEvent,
  getProvisionalPatientInfoAfterCompleteVisit,
  getReleasePatientInfoAfterCompleteVisit,
} from './appointment.data';
import { AppointmentStatusHistoryModel } from '../../appointment-history/models/appointment-status-history.model';

describe('# Appointment event listener', () => {
  let appointmentsService: AppointmentsService;
  let lookupsService: LookupsService;
  let patientInfoService: PatientInfoService;
  let moduleRef: TestingModule;
  let appointmentListener: AppointmentsListener;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule, LookupsModule, EventsModule, HttpModule, ClinicSettingsModule],
      providers: [
        { provide: APPOINTMENTS_REPOSITORY, useValue: AppointmentsModel },
        { provide: AVAILABILITY_REPOSITORY, useValue: AvailabilityModel },
        { provide: PATIENT_INFO_REPOSITORY, useValue: PatientInfoModel },
        { provide: APPOINTMENT_REQUEST_REPOSITORY, useValue: AppointmentRequestsModel },
        { provide: APPOINTMENT_REQUEST_FEATURE_REPOSITORY, useValue: AppointmentRequestFeatureStatusModel },
        { provide: APPOINTMENT_CRON_JOB_REPOSITORY, useValue: AppointmentCronJobModel },
        { provide: 'AppointmentCronJobService', useClass: AppointmentCronJobService },
        PatientInfoService,
        AppointmentsService,
        AvailabilityService,
        AvailabilityValidator,
        AppointmentEventPublisher,
        AppointmentRequestsService,
      ],
    }).compile();
    appointmentsService = moduleRef.get<AppointmentsService>(AppointmentsService);
    lookupsService = moduleRef.get<LookupsService>(LookupsService);
    patientInfoService = moduleRef.get<PatientInfoService>(PatientInfoService);
    const sequelizeInstance = moduleRef.get<Sequelize>(SEQUELIZE);
    appointmentListener = new AppointmentsListener(
      sequelizeInstance,
      appointmentsService,
      lookupsService,
      patientInfoService,
    );
  });

  beforeEach(async () => {
    await PatientInfoModel.destroy({ where: {} });
    await AppointmentsModel.destroy({ where: {} });
    await AvailabilityModel.destroy({ where: {} });
  });

  afterAll(async () => {
    await PatientInfoModel.destroy({ where: {} });
    await AppointmentsModel.destroy({ where: {} });
    await AvailabilityModel.destroy({ where: {} });
    await moduleRef.close();
  });

  test('# Services defined', () => {
    expect(appointmentsService).toBeDefined();
    expect(lookupsService).toBeDefined();
    expect(patientInfoService).toBeDefined();
    expect(appointmentListener).toBeDefined();
  });

  test('# Complete visit flow: create provisional', async () => {
    const patientInfo = await patientInfoService.create(getProvisionalPatientInfoAfterCompleteVisit());
    const identity = getTestIdentity(63, patientInfo.clinicId);

    const appointment = await appointmentsService.createProvisionalAppointment(identity, {
      appointmentTypeId: 1,
      durationMinutes: 15,
      patientId: patientInfo.id,
      staffId: 1,
      startDate: new Date('2021-10-25T07:43:40.084Z'),
    });
    const eventPayLoad = buildIConfirmCompleteVisitEvent(patientInfo, appointment, appointment, false);
    await appointmentListener.handleCompleteVisitEvent(eventPayLoad);

    const updatedAppointment = await AppointmentsModel.findOne({
      where: { id: appointment.id },
      include: [{ model: AppointmentStatusLookupsModel }],
    });
    expect(updatedAppointment.status.code).toEqual(AppointmentStatusEnum.COMPLETE);
    const createdAppointment = await appointmentsService.getAppointmentByPatientId(identity, patientInfo.id);
    const provisionalStatusId = await lookupsService.getProvisionalAppointmentStatusId(identity);
    expect(createdAppointment.appointmentStatusId).toEqual(provisionalStatusId);

    const statusChanges = await AppointmentStatusHistoryModel.findAll({
      where: {
        appointmentId: appointment.id,
      },
    });

    const waitListStatusId = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.WAIT_LIST);
    const completeStatusId = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.COMPLETE);
    expect(statusChanges.length).toEqual(2);
    expect(statusChanges[0].appointmentStatusId).toEqual(waitListStatusId);
    expect(statusChanges[1].appointmentStatusId).toEqual(completeStatusId);
  });

  test('# Complete visit flow: release patient', async () => {
    const patientInfo = await patientInfoService.create(getReleasePatientInfoAfterCompleteVisit());
    const identity = getTestIdentity(105, patientInfo.clinicId);
    const readyStatusId = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.READY);
    const appointment = await appointmentsService.createAppointment(
      identity,
      {
        appointmentTypeId: 1,
        durationMinutes: 15,
        patientId: patientInfo.id,
        staffId: 1,
        startDate: '2021-10-25T07:43:40.084Z',
        appointmentStatusId: readyStatusId,
      },
      true,
    );
    const eventPayLoad = buildIConfirmCompleteVisitEvent(patientInfo, appointment, appointment, true);
    await appointmentListener.handleCompleteVisitEvent(eventPayLoad);

    const completedAppointment = await appointmentsService.findOne(identity, appointment.id);
    expect(completedAppointment.status.code).toEqual(AppointmentStatusEnum.COMPLETE);

    const releasedAppointments = await AppointmentsModel.findOne({
      where: {
        patientId: patientInfo.id,
        upcomingAppointment: true,
      },
      include: [{ model: AppointmentStatusLookupsModel }],
    });
    expect(releasedAppointments.status.code).toEqual(AppointmentStatusEnum.RELEASED);

    const updatePatientInfo = await patientInfoService.getById(patientInfo.id);
    expect(updatePatientInfo.statusCode).toEqual(PatientStatus.RELEASED);
  });

  test('# Complete visit flow: use original appointment', async () => {
    const patientInfo = await patientInfoService.create(getReleasePatientInfoAfterCompleteVisit());
    const identity = getTestIdentity(105, patientInfo.clinicId);
    const readyStatusId = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.READY);
    const appointment = await appointmentsService.createAppointment(
      identity,
      {
        appointmentTypeId: 1,
        durationMinutes: 15,
        patientId: patientInfo.id,
        staffId: 1,
        startDate: '2021-10-25T07:43:40.084Z',
        appointmentStatusId: readyStatusId,
      },
      true,
    );
    const eventPayLoad = buildICompleteVisitEventKeepOriginalAppointment(patientInfo, appointment, false);
    await appointmentListener.handleCompleteVisitEvent(eventPayLoad);

    const updatedAppointment = await AppointmentsModel.findOne({
      where: { id: appointment.id },
      include: [{ model: AppointmentStatusLookupsModel }],
    });
    expect(updatedAppointment.status.code).toEqual(AppointmentStatusEnum.COMPLETE);
    const newAppointment = await appointmentsService.getAppointmentByPatientId(identity, patientInfo.id);
    expect(newAppointment.id !== updatedAppointment.id).toBeTruthy();
  });
});
