import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PATIENT_INFO_REPOSITORY } from 'common/constants';
import { ConfigurationModule } from 'modules/config/config.module';
import * as nock from 'nock';
import { dropDB, prepareTestDB } from 'utils/test-helpers/DatabaseHelpers';
import { PatientInfoService } from '..';
import { PatientInfoAttributes, PatientInfoModel } from '../patient-info.model';
import { PatientInfoModule } from '../patient-info.module';

describe('patient-info service', () => {
  let patientInfoSvc: PatientInfoService;
  let module: TestingModule;
  let apiURL: string;

  beforeAll(async () => {
    await prepareTestDB();
    module = await Test.createTestingModule({
      imports: [PatientInfoModule, ConfigurationModule],
    }).compile();

    patientInfoSvc = module.get<PatientInfoService>(PatientInfoService);
    apiURL = module.get<ConfigService>(ConfigService).get<string>('apiURL');
  });

  afterAll(async () => {
    await module.close();
    await dropDB();
  });

  beforeEach(async () => {
    // remove everything in the table
    await module.get<typeof PatientInfoModel>(PATIENT_INFO_REPOSITORY).destroy({ truncate: true, cascade: true });
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

    const newData = { ...patientInfo, fullName: 'Khaled' };
    const updatedResult = await patientInfoSvc.update(newData);

    expect(updatedResult).toStrictEqual(newData);
  });

  test('fetch patient info from patient-management', async () => {
    const patientId = 89;
    // mock patient management
    nock(apiURL).get(`/patient-management/patients/${patientId}`).reply(200, patientInfoResponse);

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

const patientInfoResponse = {
  actions: ['PATIENT_PROFILE_READ', 'PATIENT_PROFILE_WRITE', 'PATIENT_CONSENT_WRITE', 'PATIENT_CONSENT_SIGNED_WRITE'],
  dob: '1994-07-14',
  id: 89,
  createdAt: '2021-03-23T14:10:06.000Z',
  updatedAt: '2021-07-25T08:53:41.000Z',
  createdBy: 296,
  updatedBy: 300,
  doctorId: null,
  clinicId: 128,
  pharmacyId: 16,
  statusId: 1,
  firstName: 'Johnn',
  middleName: 'Dohh',
  lastName: 'Doh',
  email: null,
  contactMethod1Code: null,
  contactMethod2Code: null,
  genderCode: 'FEMALE',
  maritalStatusCode: null,
  imageId: null,
  occupation: 'Teacher',
  familyDoctorId: 84,
  referringDoctorId: 201,
  heightValue: '168.00',
  heightUnit: 'cm',
  weightValue: '71.64',
  weightUnit: 'kg',
  primaryHealthPlanId: 1,
  primaryHealthId: 121,
  primaryHealthPlanState: 'QC',
  primaryHealthPlanCountry: 'CA',
  primaryHealthPlanNameEn: 'Quebec Health Insurance Plan',
  primaryHealthPlanNameFr: 'Quebec Health Insurance Plan',
  primaryHealthPlanAbbrEn: 'RAMQ',
  primaryHealthPlanAbbrFr: 'RAMQ',
  primaryHealthPlanDateFormat: 'MM/YYYY',
  primaryHealthPlanNumber: 'MOX-patient09',
  primaryHealthPlanIssueDate: null,
  primaryHealthPlanExpiryDate: '2030-07-01',
  primaryPhoneNumberId: 314,
  primaryPhoneNumberTypeCode: 'HOME',
  primaryPhoneNumber: {
    id: 314,
    number: '+12312312314',
    primary: true,
    formatted: '(231) 231 2314',
    phoneNumberTypeCode: 'HOME',
    phoneNumberType: 'PHONE',
  },
  secondaryPhoneNumberId: 315,
  secondaryPhoneNumberTypeCode: 'HOME',
  secondaryPhoneNumber: {
    id: 315,
    number: '+12312312315',
    primary: false,
    formatted: '(231) 231 2315',
    phoneNumberTypeCode: 'HOME',
    phoneNumberType: 'PHONE',
  },
  faxNumberId: null,
  faxNumberTypeCode: null,
  faxNumber: null,
  homeAddressId: 134,
  homeAddressLine1: 'Almontar',
  homeAddressLine2: null,
  homeAddressCity: 'Dalas',
  homeAddressZip: null,
  homeAddressProvinceCode: 'MO',
  homeAddressCountryCode: 'CA',
  consent: {
    consented: true,
    consentObtainedBy: 300,
    consentedAt: '2021-07-25',
    consentObtainedType: 'DOCTOR',
    documentSignedId: null,
    documentSignedUploadedAt: null,
  },
  consentObtainedType: 'DOCTOR',
  consentObtainedBy: 300,
  consentedAt: '2021-07-25',
  documentSignedId: null,
  documentSignedUploadedAt: null,
  specialNotes: null,
  preferredLanguageCode: 'EN',
  dsqEligible: null,
  statusHistory: {
    id: 155,
    createdAt: '2021-05-05T14:08:57.000Z',
    updatedAt: '2021-05-05T14:08:57.000Z',
    createdBy: 300,
    updatedBy: 300,
    clinicId: 128,
    patientId: 89,
    statusId: 1,
    text: 'test',
    status: {
      id: 1,
      createdAt: '2021-02-06T11:53:14.000Z',
      updatedAt: '2021-02-06T11:53:14.000Z',
      createdBy: null,
      updatedBy: null,
      clinicId: null,
      nameEn: 'Active',
      nameFr: 'Active',
      code: 'ACTIVE',
    },
  },
  familyDoctor: {
    createdAt: '2021-05-24T11:07:33.000Z',
    updatedAt: '2021-05-24T11:07:33.000Z',
    createdBy: 300,
    updatedBy: 300,
    id: 84,
    clinicId: 128,
    fullName: 'John Piden',
    firstName: 'John',
    lastName: 'Piden',
    email: 'john@test.com',
    contactMethodCode: null,
    medicalPracticeId: 1,
    practiceNameEn: 'Family Doctor',
    practiceNameFr: 'Family Doctor',
    medicalPractice: {
      createdAt: '2021-03-02T12:32:56.000Z',
      updatedAt: '2021-03-02T12:32:56.000Z',
      createdBy: null,
      updatedBy: null,
      id: 1,
      clinicId: null,
      nameEn: 'Family Doctor',
      nameFr: 'Family Doctor',
      code: 'FAMILY_DOCTOR',
    },
    phoneNumber: {
      formatted: '(231) 231 2355',
      id: 528,
      createdAt: '2021-05-24T11:07:33.000Z',
      updatedAt: '2021-05-24T11:07:33.000Z',
      createdBy: 300,
      updatedBy: 300,
      clinicId: 128,
      entityType: 'practitioner',
      entityId: 84,
      phoneTypeCode: 'PHONE',
      phoneNumberTypeCode: 'WORK',
      number: '+12312312355',
      primary: false,
    },
    faxNumber: {
      formatted: '(231) 231 2366',
      id: 529,
      createdAt: '2021-05-24T11:07:33.000Z',
      updatedAt: '2021-05-24T11:07:33.000Z',
      createdBy: 300,
      updatedBy: 300,
      clinicId: 128,
      entityType: 'practitioner',
      entityId: 84,
      phoneTypeCode: 'FAX',
      phoneNumberTypeCode: 'WORK',
      number: '+12312312366',
      primary: false,
    },
    address: {
      formatted: ['line1', 'Dalas, MO', 'CA'],
      id: 234,
      createdAt: '2021-05-24T11:07:33.000Z',
      updatedAt: '2021-05-24T11:07:33.000Z',
      createdBy: 300,
      updatedBy: 300,
      addressTypeCode: 'WORK',
      clinicId: 128,
      entityType: 'practitioner',
      entityId: 84,
      line1: 'line1',
      line2: null,
      countryCode: 'CA',
      provinceCode: 'MO',
      city: 'Dalas',
      zip: null,
    },
  },
  referringDoctor: {
    createdAt: '2021-07-07T10:31:59.000Z',
    updatedAt: '2021-07-07T10:31:59.000Z',
    createdBy: 300,
    updatedBy: 300,
    id: 201,
    clinicId: 128,
    fullName: 'Donalid Tramb',
    firstName: 'Donalid',
    lastName: 'Tramb',
    email: 'donalid@test.com',
    contactMethodCode: 'FAX',
    medicalPracticeId: null,
    practiceNameEn: null,
    practiceNameFr: null,
    medicalPractice: null,
    phoneNumber: {
      formatted: '(231) 231 2377',
      id: 844,
      createdAt: '2021-07-07T10:31:59.000Z',
      updatedAt: '2021-07-07T10:31:59.000Z',
      createdBy: 300,
      updatedBy: 300,
      clinicId: 128,
      entityType: 'practitioner',
      entityId: 201,
      phoneTypeCode: 'PHONE',
      phoneNumberTypeCode: 'WORK',
      number: '+12312312377',
      primary: false,
    },
    faxNumber: {
      formatted: '(231) 231 2366',
      id: 845,
      createdAt: '2021-07-07T10:31:59.000Z',
      updatedAt: '2021-07-07T10:31:59.000Z',
      createdBy: 300,
      updatedBy: 300,
      clinicId: 128,
      entityType: 'practitioner',
      entityId: 201,
      phoneTypeCode: 'FAX',
      phoneNumberTypeCode: 'WORK',
      number: '+12312312366',
      primary: false,
    },
    address: {
      formatted: ['line77', 'Dalas, MO', 'CA'],
      id: 354,
      createdAt: '2021-07-07T10:31:59.000Z',
      updatedAt: '2021-07-07T10:31:59.000Z',
      createdBy: 300,
      updatedBy: 300,
      addressTypeCode: 'WORK',
      clinicId: 128,
      entityType: 'practitioner',
      entityId: 201,
      line1: 'line77',
      line2: null,
      countryCode: 'CA',
      provinceCode: 'MO',
      city: 'Dalas',
      zip: null,
    },
  },
  displayName: 'Johnn Dohh Doh',
  age: 27,
  height: {
    cm: 168,
  },
  weight: {
    kg: 71.64,
  },
  homeAddress: {
    id: 134,
    addressTypeCode: 'HOME',
    line1: 'Almontar',
    line2: null,
    city: 'Dalas',
    provinceCode: 'MO',
    countryCode: 'CA',
    zip: null,
    formatted: ['Almontar', 'Dalas, MO', 'CA'],
  },
  primaryHealthPlan: {
    id: 121,
    number: 'MOX-patient09',
    expiryDateFormatted: '07/2030',
    expiryDate: '2030-07-01',
    issueDateFormatted: null,
    issueDate: null,
    plan: {
      id: 1,
      dateFormat: 'MM/YYYY',
      nameEn: 'Quebec Health Insurance Plan',
      nameFr: 'Quebec Health Insurance Plan',
      abbrEn: 'RAMQ',
      abbrFr: 'RAMQ',
      provinceCode: 'QC',
      countryCode: 'CA',
    },
  },
  status: {
    id: 1,
    code: 'ACTIVE',
    nameEn: 'Active',
    nameFr: 'Active',
    text: 'test',
  },
};
