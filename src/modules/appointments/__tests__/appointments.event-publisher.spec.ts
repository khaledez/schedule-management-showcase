import { Test, TestingModule } from '@nestjs/testing';
import { LookupsModule } from '../../lookups/lookups.module';
import { LookupsService } from '../../lookups/lookups.service';
import { AppointmentEventPublisher } from '../appointments.event-publisher';
import { getTestIdentity } from '../../../utils/test-helpers/common-data-helpers';
import { AppointmentStatusEnum, AppointmentTypesEnum } from '../../../common/enums';
import { DatabaseModule } from '../../database/database.module';
import { ConfigurationModule } from '../../config/config.module';

describe('# Appointment event publisher', () => {
  let moduleRef: TestingModule;
  let publishAppointmentEvent: AppointmentEventPublisher;
  let lookupsService: LookupsService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [LookupsModule, DatabaseModule, ConfigurationModule],
      providers: [AppointmentEventPublisher],
    }).compile();
    publishAppointmentEvent = moduleRef.get<AppointmentEventPublisher>(AppointmentEventPublisher);
    lookupsService = moduleRef.get<LookupsService>(LookupsService);
  });

  test('# services are defined', () => {
    expect(publishAppointmentEvent).toBeDefined();
    expect(lookupsService).toBeDefined();
  });

  test.each([null, undefined])('# appointmentToEventAppointmentPayLoad: appointment = %p', async (appointment) => {
    const result = await publishAppointmentEvent.appointmentToEventAppointmentPayLoad(appointment);
    expect(result).toEqual(null);
  });

  test('# appointmentToEventAppointmentPayLoad: valid appointment', async () => {
    const identity = getTestIdentity(32, 32);
    const appointmentStatusId = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.RESCHEDULED);
    const appointmentTypeId = await lookupsService.getTypeByCode(identity, AppointmentTypesEnum.NEW);
    const status = await lookupsService.getAppointmentStatusById(appointmentStatusId);
    const type = await lookupsService.getAppointmentTypeById(appointmentTypeId);
    const startDate = new Date();
    const staffId = 10;
    const id = 20;
    const result = await publishAppointmentEvent.appointmentToEventAppointmentPayLoad({
      id,
      durationMinutes: 0,
      endDate: undefined,
      patientId: 0,
      staffId,
      startDate,
      appointmentStatusId,
      appointmentTypeId,
    });
    expect(result).toBeDefined();
    expect(result.appointmentId).toEqual(id);
    expect(result.appointmentStatus).toEqual({
      code: status.code,
      nameEn: status.nameEn,
      nameFr: status.nameFr,
    });
    expect(result.appointmentType).toEqual({
      code: type.code,
      nameEn: type.nameEn,
      nameFr: type.nameFr,
    });
    expect(result.appointmentDateTime).toEqual(startDate.toISOString());
  });
});
