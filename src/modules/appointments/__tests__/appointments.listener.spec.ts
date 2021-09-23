import { getTestIdentity } from '../../../utils/test-helpers/common-data-helpers';
import { AppointmentsService } from '../appointments.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsModel } from '../appointments.model';
import { ConfigurationModule } from '../../config/config.module';
import { DatabaseModule } from '../../database/database.module';
import { LookupsModule } from '../../lookups/lookups.module';
import { EventsModule } from '../../events/events.module';
import {
  APPOINTMENTS_REPOSITORY,
  AVAILABILITY_REPOSITORY,
  PATIENT_INFO_REPOSITORY,
  APPOINTMENT_REQUEST_REPOSITORY,
  APPOINTMENT_REQUEST_FEATURE_REPOSITORY,
  SEQUELIZE,
  APPOINTMENT_CRON_JOB_REPOSITORY,
} from '../../../common/constants';
import { AvailabilityModel } from '../../availability/models/availability.model';
import { AvailabilityService } from '../../availability/availability.service';
import { AvailabilityValidator } from '../../availability/availability.validator';
import { PatientInfoModel } from '../../patient-info/patient-info.model';
import { PatientInfoService } from '../../patient-info';
import {
  buildICompleteVisitEventKeepOriginalAppointment,
  buildIConfirmCompleteVisitEvent,
  getProvisionalPatientInfoAfterCompleteVisit,
  getReleasePatientInfoAfterCompleteVisit,
} from './appointment.data';
import { AppointmentsListener } from '../appointments.listener';
import { HttpModule } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import { LookupsService } from '../../lookups/lookups.service';
import { AppointmentStatusEnum } from '../../../common/enums';
import { PatientStatus } from '../../../common/enums/patient-status';
import { AppointmentEventPublisher } from '../appointments.event-publisher';
import { AppointmentStatusLookupsModel } from '../../lookups/models/appointment-status.model';
import { AppointmentRequestsService } from '../../appointment-requests/appointment-requests.service';
import { AppointmentRequestFeatureStatusModel, AppointmentRequestsModel } from '../../appointment-requests/models';
import { ClinicSettingsModule } from '../../clinic-settings/clinic-settings.module';
import { AppointmentCronJobModel } from '../../appointment-cron-job/appointment-cron-job.model';
import { AppointmentCronJobService } from '../../appointment-cron-job/appointment-cron-job.service';

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

    const updatedAppointment = await AppointmentsModel.findOne({
      where: { id: appointment.id },
      include: [{ model: AppointmentStatusLookupsModel }],
    });
    expect(updatedAppointment.status.code).toEqual(AppointmentStatusEnum.RELEASED);
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
