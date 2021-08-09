import { IIdentity, PagingInfoInterface } from '@dashps/monmedx-common';
import { Test, TestingModule } from '@nestjs/testing';
import { APPOINTMENTS_REPOSITORY, SEQUELIZE } from 'common/constants';
import { CancelRescheduleReasonCode } from 'common/enums';
import {
  getAppointmentByPatientIdTestCases,
  getPatientAppointmentsTestData,
  getPatientHistoryTestCases,
  getPatientHistoryTestData,
  getPatientNextAppointmentTestCases,
  getPatientUpcomingAppointmentTestCases,
} from 'modules/appointments/__tests__/appointment.data';
import { AvailabilityService } from 'modules/availability/availability.service';
import { CreateAvailabilityDto } from 'modules/availability/dto/create.dto';
import { ConfigurationModule } from 'modules/config/config.module';
import { DatabaseModule } from 'modules/database/database.module';
import { LookupsModule } from 'modules/lookups/lookups.module';
import { LookupsService } from 'modules/lookups/lookups.service';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { getTestIdentity } from 'utils/test-helpers/common-data-helpers';
import { AppointmentsModel, AppointmentsModelAttributes } from '../appointments.model';
import { AppointmentsModule } from '../appointments.module';
import { AppointmentsService } from '../appointments.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { QueryParamsDto } from '../dto/query-params.dto';

const identity: IIdentity = {
  clinicId: 1,
  userId: 2,
  cognitoId: null,
  userLang: 'en',
  userInfo: null,
};

describe('Appointment service', () => {
  let apptService: AppointmentsService;
  let moduleRef: TestingModule;
  let sequelize: Sequelize;
  let repo: typeof AppointmentsModel;
  let availabilityService: AvailabilityService;
  let lookupsService: LookupsService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule, ConfigurationModule, DatabaseModule, LookupsModule],
    }).compile();

    apptService = moduleRef.get<AppointmentsService>(AppointmentsService);
    sequelize = moduleRef.get<Sequelize>(SEQUELIZE);
    repo = moduleRef.get<typeof AppointmentsModel>(APPOINTMENTS_REPOSITORY);
    availabilityService = moduleRef.get<AvailabilityService>(AvailabilityService);
    lookupsService = moduleRef.get<LookupsService>(LookupsService);
  });

  afterAll(async () => {
    await sequelize.close();
    await moduleRef.close();
  });

  beforeEach(async () => {
    await repo.destroy({ where: {} });
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

  describe('#createAppointment', () => {
    let apptAttributes: CreateAppointmentDto;
    beforeEach(
      () =>
        (apptAttributes = {
          appointmentStatusId: 1,
          appointmentTypeId: 1,
          patientId: 15,
          staffId: 20,
          startDate: new Date().toISOString(),
          durationMinutes: 60,
        }),
    );
    test('Creating an appointment without availabilityId or startDate & durationMinutes & appointmentTypeId', async (done) => {
      delete apptAttributes.startDate;
      delete apptAttributes.durationMinutes;
      try {
        await apptService.createAppointment(identity, apptAttributes);
      } catch (err) {
        expect(err.message).toMatch(
          "You didn't provide availbilityId you must provide: startDate, durationMinutes and appointmentTypeId",
        );
      }
      done();
    });

    test('Fails providing no availabilityId with startDate & durationDuration but no appointmentTypeId', async (done) => {
      delete apptAttributes.appointmentTypeId;
      try {
        await apptService.createAppointment(identity, apptAttributes);
      } catch (err) {
        expect(err.message).toMatch(
          "You didn't provide availbilityId you must provide: startDate, durationMinutes and appointmentTypeId",
        );
      }
      done();
    });

    test('Fails if creating a provisional appointment while the patient has an existent one', async (done) => {
      // Create patient with provisional
      await expect(apptService.createAppointment(identity, apptAttributes)).resolves.toBeDefined();
      // Create provisional again w/ same patient
      try {
        await apptService.createAppointment(identity, apptAttributes);
      } catch (err) {
        expect(err.message).toMatch('Patient already has a provisional appointment');
      }
      done();
    });

    test('Fails if provided availbilityId corresponding to non-existent availability', async () => {
      delete apptAttributes.startDate;
      delete apptAttributes.durationMinutes;
      apptAttributes.availabilityId = 3579;
      const action = apptService.createAppointment(identity, apptAttributes);
      await expect(action).rejects.toThrow('This availability does not exits!');
    });

    test('Fails provided invalid status id', async () => {
      apptAttributes.appointmentStatusId = 3579;
      const action = apptService.createAppointment(identity, apptAttributes);
      await expect(action).rejects.toThrow('unknown appointment status ID');
    });

    test('Succeeds providing valid startDate, durationMinutes, appointmentTypeId', async () => {
      const action = apptService.createAppointment(identity, apptAttributes);
      const res = await action;
      expect(res.appointmentTypeId).toBe(apptAttributes.appointmentTypeId);
      expect(res.startDate.toISOString()).toBe(apptAttributes.startDate);
      expect(res.durationMinutes).toBe(apptAttributes.durationMinutes);
      expect(res.availabilityId).toBeDefined();
    });

    test('Succeed providing valid availability id and other inputs', async () => {
      const tempTransaction = await sequelize.transaction();
      const availabilityAttributes: CreateAvailabilityDto = {
        staffId: apptAttributes.staffId,
        appointmentTypeId: apptAttributes.appointmentTypeId,
        durationMinutes: apptAttributes.durationMinutes,
        startDate: apptAttributes.startDate,
      };
      // Create one availability and access it
      const createdAvailability = (
        await availabilityService.bulkCreate([availabilityAttributes], identity, tempTransaction)
      )[0];
      await tempTransaction.commit();
      // Assign newly created availabilty to appointment attributes
      apptAttributes.availabilityId = createdAvailability.id;
      const res = await apptService.createAppointment(identity, apptAttributes);
      expect(res).toBeDefined();
      expect(res.staffId).toBe(apptAttributes.staffId);
      expect(res.durationMinutes).toEqual(createdAvailability.durationMinutes);
    });

    test('Succeeds in creating non-provisional appointment if an existing provisional appointment exists for same patient', async () => {
      delete apptAttributes.appointmentStatusId; // Defaults to provisional if not status id not provided
      const provisionalAppointment = await apptService.createAppointment(identity, apptAttributes);
      apptAttributes.startDate = new Date('2100-01-01').toISOString();
      apptAttributes.appointmentStatusId = 2;
      const nonProvisionalAppointment = await apptService.createAppointment(identity, apptAttributes);
      expect(nonProvisionalAppointment.provisionalDate.toISOString()).toMatch(
        provisionalAppointment.startDate.toISOString().split('.')[0],
      );
      expect(nonProvisionalAppointment.appointmentStatusId).toEqual(2);
      expect(nonProvisionalAppointment.startDate.toISOString()).toMatch(apptAttributes.startDate.split('.')[0]);
      // Get created availability
      const availability = await availabilityService.findOne(nonProvisionalAppointment.availabilityId);
      expect(availability.appointmentId).toBe(nonProvisionalAppointment.id);
    });
  });

  describe('# Cancel appointment', () => {
    let appointmentId: number;
    beforeEach(async () => {
      await repo.destroy({ where: {} });
      const appt = await apptService.createAppointment(getTestIdentity(50, 50), {
        appointmentStatusId: 1,
        appointmentTypeId: 3,
        patientId: 15,
        staffId: 10,
        startDate: new Date().toISOString(),
        durationMinutes: 60,
      });
      appointmentId = appt.id;
    });

    test('cancelReason does not exist', async () => {
      await expect(
        apptService.cancelAppointment(getTestIdentity(50, 50), {
          appointmentId,
          provisionalDate: '2091-10-10',
          reasonText: 'Bye Bye',
          reasonId: 10,
          keepAvailabiltySlot: true,
        }),
      ).rejects.toMatchObject({
        response: { fields: ['cancel_reschedule_reason_id', 'reasonId'], unknownIds: [10] },
      });
    });

    test('appointment does not exist', async () => {
      await expect(
        apptService.cancelAppointment(getTestIdentity(50, 50), {
          appointmentId: 9999,
          provisionalDate: '2091-10-10',
          reasonText: 'ByeBye',
          keepAvailabiltySlot: true,
          reasonId: await lookupsService.getCancelRescheduleReasonByCode(CancelRescheduleReasonCode.RELEASE),
        }),
      ).rejects.toMatchObject({ response: { message: 'Appointment with id = 9999 not found' } });
    });

    // test('appointment canceled and availability is still active', async () => {
    //   const appt = await apptService.createAppointment(getTestIdentity(50, 50), {
    //     appointmentStatusId: 2,
    //     appointmentTypeId: 3,
    //     patientId: 15,
    //     staffId: 20,
    //     startDate: new Date().toISOString(),
    //     durationMinutes: 15,
    //   });
    //   await expect(
    //     apptService.cancelAppointment(getTestIdentity(50, 50), {
    //       appointmentId,
    //       provisionalDate: '2091-10-10',
    //       reasonText: 'ByeBye',
    //       keepAvailabiltySlot: true,
    //       reasonId: await lookupsService.getCancelRescheduleReasonByCode(CancelRescheduleReasonCode.RELEASE),
    //     }),
    //   ).resolves.toBeUndefined();

    //   await expect(availabilityService.findOne(appt.availabilityId)).resolves.toMatchObject({
    //     appointmentId: null,
    //     appointmentTypeId: 3,
    //     clinicId: 50,
    //   });
    // });
  });
});

describe('Patient appointment history tests', () => {
  const identity = getTestIdentity(174, 174);
  let appointmentsService: AppointmentsService;
  let moduleRef: TestingModule;
  let repo: typeof AppointmentsModel;
  let createdAppointmentsIds = [];

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule, ConfigurationModule, DatabaseModule],
    }).compile();
    appointmentsService = moduleRef.get<AppointmentsService>(AppointmentsService);
    repo = moduleRef.get<typeof AppointmentsModel>(APPOINTMENTS_REPOSITORY);
    const creationAttributes: AppointmentsModelAttributes[] = getPatientHistoryTestData(identity);
    const createdAppointments = await repo.bulkCreate(creationAttributes);
    createdAppointmentsIds = createdAppointments.map((appointment) => appointment.id);
  });

  afterAll(async () => {
    await repo.destroy({
      where: {
        id: {
          [Op.in]: createdAppointmentsIds,
        },
      },
    });
    await moduleRef.close();
  });

  test.each(getPatientHistoryTestCases())('# getPatientAppointmentHistory: %p', async (testCase) => {
    const [appointments, count] = await appointmentsService.getPatientAppointmentHistory(
      identity,
      testCase.pagingFilter,
      testCase.payload,
    );
    expect(count).toEqual(testCase.expectedResult.count);
    expect(appointments.map((appointment) => appointment.startDate.toISOString())).toEqual(
      testCase.expectedResult.datesOrder,
    );
  });
});

describe('Patient upcoming and next appointments tests', () => {
  const identity = getTestIdentity(295, 295);
  let appointmentsService: AppointmentsService;
  let moduleRef: TestingModule;
  let repo: typeof AppointmentsModel;
  let createdAppointmentsIds = [];

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule, ConfigurationModule, DatabaseModule],
    }).compile();
    appointmentsService = moduleRef.get<AppointmentsService>(AppointmentsService);
    repo = moduleRef.get<typeof AppointmentsModel>(APPOINTMENTS_REPOSITORY);
    const creationAttributes: AppointmentsModelAttributes[] = getPatientAppointmentsTestData(identity);
    const createdAppointments = await repo.bulkCreate(creationAttributes);
    createdAppointmentsIds = createdAppointments.map((appointment) => appointment.id);
  });

  afterAll(async () => {
    await repo.destroy({
      where: {
        id: {
          [Op.in]: createdAppointmentsIds,
        },
      },
    });
    await moduleRef.close();
  });

  test.each(getAppointmentByPatientIdTestCases())('#getAppointmentByPatientId: %p', async (testCase) => {
    if (testCase.query) {
      testCase.query.after = createdAppointmentsIds[testCase.query.after];
    }
    const result = await appointmentsService.getAppointmentByPatientId(identity, testCase.patientId, testCase.query);
    expect(result?.startDate).toEqual(testCase.date);
  });

  test.each(getPatientUpcomingAppointmentTestCases())('#getPatientUpcomingAppointment: %p', async (testCase) => {
    const result = await appointmentsService.getPatientUpcomingAppointment(identity, testCase.patientId);
    expect(result?.startDate).toEqual(testCase.date);
  });

  test.each(getPatientNextAppointmentTestCases())('#getPatientNextAppointment: %p', async (testCase) => {
    const result = await appointmentsService.getPatientNextAppointment(
      identity,
      testCase.patientId,
      createdAppointmentsIds[testCase.appointmentId],
    );
    expect(result?.startDate).toEqual(testCase.date);
  });
});
