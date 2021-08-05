import { IIdentity } from '@dashps/monmedx-common';
import { Test, TestingModule } from '@nestjs/testing';
import { APPOINTMENTS_REPOSITORY, AVAILABILITY_REPOSITORY, EVENTS_REPOSITORY, SEQUELIZE } from 'common/constants';
import { AppointmentsModel } from 'modules/appointments/appointments.model';
import { AppointmentsModule } from 'modules/appointments/appointments.module';
import { AppointmentsService } from 'modules/appointments/appointments.service';
import { AvailabilityModel } from 'modules/availability/models/availability.model';
import { ConfigurationModule } from 'modules/config/config.module';
import { DatabaseModule } from 'modules/database/database.module';
import { EventsService } from 'modules/events/events.service';
import { EventModel } from 'modules/events/models';
import { Sequelize } from 'sequelize-typescript';
import { CalendarModule } from '../calendar.module';
import { CalendarService } from '../calendar.service';

const identity: IIdentity = {
  clinicId: 1,
  userId: 2,
  cognitoId: null,
  userLang: 'en',
  userInfo: null,
};

describe('Calendar service', () => {
  let calendarService: CalendarService;
  let moduleRef: TestingModule;
  let sequelize: Sequelize;
  let eventRepo: typeof EventModel;
  let apptRepo: typeof AppointmentsModel;
  let availRepo: typeof AvailabilityModel;
  let eventService: EventsService;
  let apptService: AppointmentsService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CalendarModule, AppointmentsModule, ConfigurationModule, DatabaseModule],
    }).compile();

    calendarService = moduleRef.get<CalendarService>(CalendarService);
    sequelize = moduleRef.get<Sequelize>(SEQUELIZE);
    eventRepo = moduleRef.get<typeof EventModel>(EVENTS_REPOSITORY);
    apptRepo = moduleRef.get<typeof AppointmentsModel>(APPOINTMENTS_REPOSITORY);
    availRepo = moduleRef.get<typeof AvailabilityModel>(AVAILABILITY_REPOSITORY);
    eventService = moduleRef.get<EventsService>(EventsService);
    apptService = moduleRef.get<AppointmentsService>(AppointmentsService);
  });

  afterAll(async () => {
    await sequelize.close();
    await moduleRef.close();
  });

  beforeEach(async () => {
    await eventRepo.destroy({ where: {} });
    await apptRepo.destroy({ where: {} });
    await availRepo.destroy({ where: {} });
  });
  test('should be defined', () => {
    expect(calendarService).toBeDefined();
  });

  test('Should return the 3 newly created events', async () => {
    await eventService.create(identity, {
      staffId: 100,
      startDate: new Date('2021-09-01'),
    });
    await eventService.create(identity, {
      staffId: 100,
      startDate: new Date('2021-09-02'),
    });
    await eventService.create(identity, {
      staffId: 100,
      startDate: new Date('2021-09-02'),
    });
    const allEvents = await calendarService.search(identity, {
      staffId: {
        eq: 100,
        or: null,
      },
      dateRange: {
        between: [new Date('2021-09-01'), new Date('2021-09-03')],
        eq: null,
        ge: null,
        gt: null,
        lt: null,
        ne: null,
      },
    });
    expect(allEvents.entries).toHaveLength(3);
    allEvents.entries.forEach((entry) => {
      expect(entry.entryType).toMatch('EVENT');
    });
  });

  test('Should return 2 events and appointment, on provisional appointment creation', async () => {
    await eventService.create(identity, {
      staffId: 100,
      startDate: new Date('2021-09-01'),
    });
    await eventService.create(identity, {
      staffId: 100,
      startDate: new Date('2021-09-02'),
    });
    await apptService.createAppointment(identity, {
      staffId: 100,
      patientId: 1,
      appointmentTypeId: 1,
      durationMinutes: 120,
      startDate: '2021-09-03',
    });
    const allEvents = await calendarService.search(identity, {
      staffId: {
        eq: 100,
        or: null,
      },
      dateRange: {
        between: [new Date('2021-09-01'), new Date('2021-09-03')],
        eq: null,
        ge: null,
        gt: null,
        lt: null,
        ne: null,
      },
    });
    expect(allEvents.entries).toHaveLength(3);
  });

  test('Should return 2 events, an appointment and its corresponding availability, on non-provisional appointment creation', async () => {
    await eventService.create(identity, {
      staffId: 100,
      startDate: new Date('2021-09-01'),
    });
    await eventService.create(identity, {
      staffId: 100,
      startDate: new Date('2021-09-02'),
    });
    // Provisional
    await apptService.createAppointment(identity, {
      staffId: 100,
      patientId: 1,
      appointmentTypeId: 1,
      durationMinutes: 120,
      startDate: '2021-09-10',
    });
    // Non-Provisional
    await apptService.createAppointment(identity, {
      staffId: 100,
      patientId: 1,
      appointmentTypeId: 1,
      appointmentStatusId: 2,
      durationMinutes: 120,
      startDate: '2021-09-03',
    });
    const allEvents = await calendarService.search(identity, {
      staffId: {
        eq: 100,
        or: null,
      },
      dateRange: {
        between: [new Date('2021-09-01'), new Date('2021-09-10')],
        eq: null,
        ge: null,
        gt: null,
        lt: null,
        ne: null,
      },
    });
    expect(allEvents.entries).toHaveLength(5);
    const entryTypes = allEvents.entries.map((entry) => entry.entryType);
    const expectedAppointmentEntries = ['AVAILABILITY', 'APPOINTMENT', 'APPOINTMENT', 'EVENT', 'EVENT'];
    expect(entryTypes.sort()).toEqual(expectedAppointmentEntries.sort());
  });
});