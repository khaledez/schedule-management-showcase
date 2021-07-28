import { IIdentity, PagingInfoInterface } from '@dashps/monmedx-common';
import { Test, TestingModule } from '@nestjs/testing';
import { APPOINTMENTS_REPOSITORY, PATIENT_INFO_REPOSITORY } from 'common/constants';
import { QueryParamsDto } from 'common/dtos';
import { AppointmentStatusEnum } from 'common/enums/appointment-status.enum';
import { AvailabilityService } from 'modules/availability/availability.service';
import { ConfigurationModule } from 'modules/config/config.module';
import { LookupsService } from 'modules/lookups/lookups.service';
import { AppointmentTypesLookupsModel } from 'modules/lookups/models/appointment-types.model';
import { PatientInfoModel } from 'modules/patient-info/patient-info.model';
import { AppointmentsModel } from '../appointments.model';
import { AppointmentsModule } from '../appointments.module';
import { AppointmentsService } from '../appointments.service';
import { CreateNonProvisionalAppointmentDto } from '../dto/create-non-provisional-appointment.dto';

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

  beforeEach(async () => {
    // remove everything in the table
    await moduleRef.get<typeof AppointmentsModel>(APPOINTMENTS_REPOSITORY).destroy({ truncate: true });
    await moduleRef.get<typeof PatientInfoModel>(PATIENT_INFO_REPOSITORY).destroy({ truncate: true });
  });

  test('should be defined', () => {
    expect(apptService).toBeDefined();
  });

  test('searches for appointment provided a date of birth', async () => {
    const query: QueryParamsDto = {
      filter: { dob: { eq: new Date('1992-05-01') } },
    };
    const pagination: PagingInfoInterface = { limit: 30, offset: 0 };
    const [result, pageInfo] = await apptService.searchWithPatientInfo(identity, query, pagination);

    expect(pageInfo.total).toBe(0);
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

async function prepareAppointmentDto(
  lookupsService: LookupsService,
  availabilityService: AvailabilityService,
  input: {
    status: AppointmentStatusEnum;
    type: AppointmentTypesLookupsModel;
    date: Date;
    durationMinutes: number;
    patientId: number;
    doctorId: number;
  },
): Promise<CreateNonProvisionalAppointmentDto> {
  // 1. find an empty slot for the doctor

  // 2. if not available create one
  const apptDto: CreateNonProvisionalAppointmentDto = new CreateNonProvisionalAppointmentDto();
  apptDto.clinicId = identity.clinicId;
  apptDto.appointmentStatusId = await lookupsService.getStatusIdByCode(input.status);
  apptDto.patientId = input.patientId;
  apptDto.doctorId = input.doctorId;
  apptDto.availabilityId = 1;
  apptDto.date = input.date;
  apptDto.createdBy = identity.userId;

  return apptDto;
}
