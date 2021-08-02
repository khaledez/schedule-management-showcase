import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationModule } from 'modules/config/config.module';
import * as nock from 'nock';
import { PatientInfoService } from '..';
import { PatientInfoAttributes } from '../patient-info.model';
import { PatientInfoModule } from '../patient-info.module';
import { getTestPatientInfoResponse } from 'modules/patient-info/__tests__/patient-info.data';

describe('patient-info service', () => {
  let patientInfoSvc: PatientInfoService;
  let module: TestingModule;
  let apiURL: string;
  let createdPatientInfoIds = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PatientInfoModule, ConfigurationModule],
    }).compile();

    patientInfoSvc = module.get<PatientInfoService>(PatientInfoService);
    apiURL = module.get<ConfigService>(ConfigService).get<string>('apiURL');
  });

  afterAll(async () => {
    await module.close();
  });

  afterEach(async () => {
    await patientInfoSvc.deleteByIdsList(createdPatientInfoIds);
    createdPatientInfoIds = [];
  });

  test('create and read patient from db', async () => {
    const patientInfo: PatientInfoAttributes = {
      id: 1,
      clinicId: 1,
      fullName: 'Khaled Ezzughayyar',
      dob: '1988-11-01',
      primaryHealthPlanNumber: '123AB',
      statusCode: 'RELEASED',
    };

    await patientInfoSvc.create(patientInfo);
    createdPatientInfoIds.push(patientInfo.id);
    const result = await patientInfoSvc.getById(patientInfo.id);

    expect(result).toStrictEqual(patientInfo);
  });

  test('update patient', async () => {
    const patientInfo: PatientInfoAttributes = {
      id: 1,
      clinicId: 1,
      fullName: 'Khaled Ezzughayyar',
      dob: '1988-11-01',
      primaryHealthPlanNumber: '123AB',
      statusCode: 'ACTIVE',
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
      fullName: 'Johnn Doh',
      primaryHealthPlanNumber: 'MOX-patient09',
      statusCode: 'ACTIVE',
    });
  });
});
