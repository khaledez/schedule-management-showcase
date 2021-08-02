import { IIdentity, PagingInfoInterface } from '@dashps/monmedx-common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationModule } from 'modules/config/config.module';
import { AppointmentsModule } from '../appointments.module';
import { AppointmentsService } from '../appointments.service';
import { CreateNonProvisionalAppointmentDto } from '../dto/create-non-provisional-appointment.dto';
import { QueryParamsDto } from '../dto/query-params.dto';

describe('appointment service', () => {
  let apptService: AppointmentsService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule, ConfigurationModule],
    }).compile();

    apptService = moduleRef.get<AppointmentsService>(AppointmentsService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  test('should be defined', () => {
    expect(apptService).toBeDefined();
  });

  test('searches for appointment provided a date of birth', async () => {
    const query: QueryParamsDto = {
      filter: { dob: { eq: new Date('1992-05-01') } },
    };
    const pagination: PagingInfoInterface = { limit: 30, offset: 0 };
    const [result, count] = await apptService.searchWithPatientInfo(identity, query, pagination);

    expect(count).toBe(0);
    expect(result).toHaveLength(0);
  });

  test('creating an appointment for patient when patientInfo is not available', () => {
    // Given appointment info
    const apptAttributes: CreateNonProvisionalAppointmentDto = new CreateNonProvisionalAppointmentDto();
    apptAttributes.clinicId = identity.clinicId;
    apptAttributes.appointmentStatusId = 1;
    apptAttributes.patientId = 15;
    apptAttributes.doctorId = 20;
    apptAttributes.availabilityId = 1;
    apptAttributes.date = new Date();

    // const result = await apptService.createNonProvisionalAppointment(apptAttributes);
    // console.log(result);
  });
});

const identity: IIdentity = {
  clinicId: 1,
  userId: 2,
  cognitoId: null,
  userLang: 'en',
  userInfo: null,
};
