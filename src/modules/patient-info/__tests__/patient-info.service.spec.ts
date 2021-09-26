import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationModule } from 'modules/config/config.module';
import { getTestPatientInfoResponse } from 'modules/patient-info/__tests__/patient-info.data';
import * as nock from 'nock';
import { PatientInfoService } from '..';
import { PatientInfoAttributes } from '../patient-info.model';
import { PatientInfoModule } from '../patient-info.module';
import { PatientStatus } from '../../../common/enums/patient-status';
import { getTestIdentity } from '../../../utils/test-helpers/common-data-helpers';
import { AppointmentsService } from '../../appointments/appointments.service';
import { AppointmentsModel } from '../../appointments/appointments.model';
import { AvailabilityModel } from '../../availability/models/availability.model';

describe('patient-info service', () => {
  let patientInfoSvc: PatientInfoService;
  let appointmentsService: AppointmentsService;
  let module: TestingModule;
  let apiURL: string;
  let createdPatientInfoIds = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PatientInfoModule, ConfigurationModule],
    }).compile();

    patientInfoSvc = module.get<PatientInfoService>(PatientInfoService);
    appointmentsService = module.get<AppointmentsService>(AppointmentsService);
    apiURL = module.get<ConfigService>(ConfigService).get<string>('apiURL');
  });

  afterAll(async () => {
    await module.close();
  });

  afterEach(async () => {
    await patientInfoSvc.deleteByIdsList(createdPatientInfoIds);
    await AppointmentsModel.destroy({ where: {} });
    await AvailabilityModel.destroy({ where: {} });
    createdPatientInfoIds = [];
  });

  test('create and read patient from db', async () => {
    const patientInfo: PatientInfoAttributes = {
      id: 1,
      clinicId: 1,
      fullName: 'Khaled Ezzughayyar',
      doctorId: 233,
      dob: '1988-11-01',
      primaryHealthPlanNumber: '123AB',
      statusCode: 'RELEASED',
      legacyId: 'legacyId-1',
      userId: null,
      displayPatientId: 'legacyId-1',
    };

    await patientInfoSvc.create(patientInfo);
    createdPatientInfoIds.push(patientInfo.id);
    const result = await patientInfoSvc.getById(patientInfo.id);

    expect(result).toStrictEqual({ ...patientInfo });
  });

  test('update patient', async () => {
    const patientInfo: PatientInfoAttributes = {
      id: 1,
      clinicId: 1,
      doctorId: 333,
      fullName: 'Khaled Ezzughayyar',
      dob: '1988-11-01',
      primaryHealthPlanNumber: '123AB',
      statusCode: 'ACTIVE',
      userId: 1,
      legacyId: 'legacy-1',
      displayPatientId: 'legacy-1',
    };

    await patientInfoSvc.create(patientInfo);
    createdPatientInfoIds.push(patientInfo.id);
    const newData = { ...patientInfo, fullName: 'Khaled' };
    const updatedResult = await patientInfoSvc.update(newData);

    expect(updatedResult).toStrictEqual(newData);
  });

  test('fetch patient info from patient-management', async () => {
    const patientId = 89;
    // mock patient management
    nock(apiURL).get(`/patient-management/patients/${patientId}`).reply(200, getTestPatientInfoResponse());

    // When ..
    const result = await patientInfoSvc.fetchPatientInfo('very_secret', patientId);

    // Then ..
    expect(result).toStrictEqual({
      clinicId: 128,
      id: 89,
      dob: '1994-07-14',
      doctorId: null,
      fullName: 'Johnn Doh',
      primaryHealthPlanNumber: 'MOX-patient09',
      statusCode: 'ACTIVE',
      legacyId: null,
    });
  });

  test('# Release patient test', async () => {
    const patientInfo: PatientInfoAttributes = {
      id: 95,
      clinicId: 96,
      fullName: 'Patient to be released',
      doctorId: 98,
      dob: '1988-11-01',
      primaryHealthPlanNumber: '123AB',
      statusCode: PatientStatus.ACTIVE,
      legacyId: 'legacyId-1',
      userId: null,
      displayPatientId: 'legacyId-1',
    };
    await patientInfoSvc.create(patientInfo);
    createdPatientInfoIds.push(patientInfo.id);

    const result = await patientInfoSvc.getById(patientInfo.id);
    expect(result).toStrictEqual({ ...patientInfo, userId: null });

    const releasedPatient = await patientInfoSvc.releasePatient(96, patientInfo.id);
    expect(releasedPatient).toStrictEqual({ ...patientInfo, statusCode: PatientStatus.RELEASED });
  });

  test('# Activate patient test', async () => {
    const identity = getTestIdentity(123, 123);
    const patientInfoAttributes: PatientInfoAttributes = {
      id: 115,
      clinicId: identity.clinicId,
      fullName: 'Patient to be released',
      doctorId: 98,
      dob: '1988-11-01',
      primaryHealthPlanNumber: '123AB',
      statusCode: PatientStatus.RELEASED,
      legacyId: 'legacyId-1',
      userId: null,
      displayPatientId: 'legacyId-1',
    };

    const payload = {
      patientId: patientInfoAttributes.id,
      provisionalDate: new Date('2022-05-25T07:43:40.000Z'),
      notes: 'test notes',
    };

    await patientInfoSvc.create(patientInfoAttributes);
    createdPatientInfoIds.push(patientInfoAttributes.id);

    await patientInfoSvc.reactivatePatient(identity, payload);
    const activatedPatient = await patientInfoSvc.getById(patientInfoAttributes.id);
    expect(activatedPatient).toStrictEqual({
      ...patientInfoAttributes,
      statusCode: PatientStatus.ACTIVE,
    });
    const appointment = await appointmentsService.getPatientProvisionalAppointment(identity, patientInfoAttributes.id);
    expect(appointment).toBeDefined();
    expect(appointment.startDate).toEqual(payload.provisionalDate);
    expect(appointment.staffId).toEqual(patientInfoAttributes.doctorId);
    expect(appointment.complaintsNotes).toEqual(payload.notes);
  });
});
