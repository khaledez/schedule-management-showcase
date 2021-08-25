import { IIdentity, PagingInfoInterface } from '@dashps/monmedx-common';
import { Test, TestingModule } from '@nestjs/testing';
import { APPOINTMENTS_REPOSITORY, DEFAULT_APPOINTMENT_THRESHOLD_DAYS, SEQUELIZE } from 'common/constants';
import { AppointmentStatusEnum, CancelRescheduleReasonCode } from 'common/enums';
import { DateTime } from 'luxon';
import {
  getAppointmentByPatientIdTestCases,
  getAppointmentWithActionsTestCases,
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
  // clinicId: Math.floor(Math.random() * 1000),
  clinicId: 5000,
  userId: 2,
  cognitoId: null,
  userLang: 'en',
  userInfo: null,
};

describe('Appointment Actions', () => {
  let moduleRef: TestingModule;
  let lookupsService: LookupsService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule, LookupsModule],
    }).compile();

    lookupsService = moduleRef.get<LookupsService>(LookupsService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  test.each(getAppointmentWithActionsTestCases())('#checkAppointmentsActions Primary: %p', async (testCase) => {
    const actionsResult: any = await lookupsService.findAppointmentsActions([testCase.statusId]);
    //console.log(util.inspect(actionsResult));
    expect(actionsResult[0]?.nextAction?.code).toEqual(testCase.Primary[0]);
  });

  test.each(getAppointmentWithActionsTestCases())('#checkAppointmentsActions Secondary: %p', async (testCase) => {
    const actionsResult: any = await lookupsService.findAppointmentsActions([testCase.statusId]);
    //console.log(util.inspect(actionsResult));
    const actionsCodes = actionsResult[0]?.secondaryActions.map((el) => el.code);
    expect(actionsCodes.sort()).toEqual(testCase.Secondary.sort());
  });
});
describe('Appointment service', () => {
  let apptService: AppointmentsService;
  let moduleRef: TestingModule;
  let sequelize: Sequelize;
  let availabilityService: AvailabilityService;
  let lookupsService: LookupsService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule, ConfigurationModule, DatabaseModule, LookupsModule],
    }).compile();

    apptService = moduleRef.get<AppointmentsService>(AppointmentsService);
    lookupsService = moduleRef.get<LookupsService>(LookupsService);
    sequelize = moduleRef.get<Sequelize>(SEQUELIZE);
    availabilityService = moduleRef.get<AvailabilityService>(AvailabilityService);
  });

  afterAll(async () => {
    await sequelize.query('SET FOREIGN_KEY_CHECKS=0;');
    await sequelize.query(`DELETE FROM Events WHERE clinic_id = ${identity.clinicId}`);
    await sequelize.query(`DELETE FROM Appointments WHERE clinic_id = ${identity.clinicId}`);
    await sequelize.query(`DELETE FROM Availability WHERE clinic_id = ${identity.clinicId}`);
    await sequelize.query('SET FOREIGN_KEY_CHECKS=1;');
    await sequelize.close();
    await moduleRef.close();
  });

  beforeEach(async () => {
    await sequelize.query('SET FOREIGN_KEY_CHECKS=0;');
    await sequelize.query(`DELETE FROM Events WHERE clinic_id = ${identity.clinicId}`);
    await sequelize.query(`DELETE FROM Appointments WHERE clinic_id = ${identity.clinicId}`);
    await sequelize.query(`DELETE FROM Availability WHERE clinic_id = ${identity.clinicId}`);
    await sequelize.query('SET FOREIGN_KEY_CHECKS=1;');
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
        await apptService.createAppointment(identity, apptAttributes, true);
      } catch (err) {
        expect(err.message).toMatch(
          "You didn't provide availabilityId you must provide: startDate, durationMinutes and appointmentTypeId",
        );
      }
      done();
    });

    test('Fails providing no availabilityId with startDate & durationDuration but no appointmentTypeId', async (done) => {
      delete apptAttributes.appointmentTypeId;
      try {
        await apptService.createAppointment(identity, apptAttributes, true);
      } catch (err) {
        expect(err.message).toMatch(
          "You didn't provide availabilityId you must provide: startDate, durationMinutes and appointmentTypeId",
        );
      }
      done();
    });

    test('Creating an appointment with availabilityId must set the provided availability to occupied', async () => {
      const createdAvailability = await availabilityService.createSingleAvailability(identity, {
        appointmentTypeId: 2,
        durationMinutes: 30,
        staffId: 333,
        startDate: '2021-12-12T15:00:00.000Z',
      });

      await expect(createdAvailability.isOccupied).toBeFalsy();

      const createdAppointment = await apptService.createAppointment(
        identity,
        {
          patientId: 245,
          appointmentStatusId: await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.SCHEDULE),
          availabilityId: createdAvailability.id,
        },
        true,
      );

      await expect(createdAppointment.staffId).toBe(333);
      await expect(createdAppointment.appointmentTypeId).toBe(2);

      const availabilityAfterUpdate = await availabilityService.findOne(createdAvailability.id);
      await expect(availabilityAfterUpdate.isOccupied).toBe(true);
    });

    test('Fails if creating a provisional appointment while the patient has an existent one', async (done) => {
      // Create patient with provisional
      await expect(apptService.createAppointment(identity, apptAttributes, true)).resolves.toBeDefined();
      // Create provisional again w/ same patient
      try {
        await apptService.createAppointment(identity, apptAttributes, true);
      } catch (err) {
        expect(err.message).toMatch('Patient already has a provisional appointment');
      }
      done();
    });

    test('Fails if provided availbilityId corresponding to non-existent availability', async () => {
      delete apptAttributes.startDate;
      delete apptAttributes.durationMinutes;
      apptAttributes.availabilityId = 3579;
      const action = apptService.createAppointment(identity, apptAttributes, true);
      await expect(action).rejects.toThrow('This availability does not exits!');
    });

    test('Fails provided invalid status id', async () => {
      apptAttributes.appointmentStatusId = 3579;
      const action = apptService.createAppointment(identity, apptAttributes, true);
      await expect(action).rejects.toThrow('unknown appointment status ID');
    });

    test('Succeeds providing valid startDate, durationMinutes, appointmentTypeId', async () => {
      const action = apptService.createAppointment(identity, apptAttributes, true);
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
      const res = await apptService.createAppointment(identity, apptAttributes, true);
      expect(res).toBeDefined();
      expect(res.staffId).toBe(apptAttributes.staffId);
      expect(res.durationMinutes).toEqual(createdAvailability.durationMinutes);
    });

    test('Succeeds in creating non-provisional appointment if an existing provisional appointment exists for same patient', async () => {
      delete apptAttributes.appointmentStatusId; // Defaults to provisional if not status id not provided
      const provisionalAppointment = await apptService.createAppointment(identity, apptAttributes, true);
      apptAttributes.startDate = new Date('2100-01-01').toISOString();
      apptAttributes.appointmentStatusId = 2;
      const nonProvisionalAppointment = await apptService.createAppointment(identity, apptAttributes, true);
      expect(nonProvisionalAppointment.provisionalDate.toISOString()).toMatch(
        provisionalAppointment.startDate.toISOString().split('.')[0],
      );
      expect(nonProvisionalAppointment.appointmentStatusId).toEqual(2);
      expect(nonProvisionalAppointment.startDate.toISOString()).toMatch(apptAttributes.startDate.split('.')[0]);
      // Get created availability
      const availability = await availabilityService.findOne(nonProvisionalAppointment.availabilityId);
      expect(availability).toBeDefined();
    });
  });

  describe('Notifications', () => {
    let apptAttributes: CreateAppointmentDto;
    let scopeIdentity: IIdentity;
    beforeEach(() => {
      apptAttributes = {
        appointmentStatusId: 1,
        appointmentTypeId: 1,
        patientId: 15,
        staffId: 20,
        startDate: new Date().toISOString(),
        durationMinutes: 60,
      };
      scopeIdentity = { ...identity };
    });
    test('Returns missed appointments', async () => {
      // 1. Arrange
      const confirm1 = await lookupsService.getStatusIdByCode(scopeIdentity, AppointmentStatusEnum.CONFIRM1);
      const confirm2 = await lookupsService.getStatusIdByCode(scopeIdentity, AppointmentStatusEnum.CONFIRM2);
      const checkIn = await lookupsService.getStatusIdByCode(scopeIdentity, AppointmentStatusEnum.CHECK_IN);

      // Create 2 confirmed non-provisional appointments in the past (Simulating missed)
      await createProvisionalAppointmentWithNonProvisionalAfterXDays(scopeIdentity, 333, confirm1, -1);
      await createProvisionalAppointmentWithNonProvisionalAfterXDays(scopeIdentity, 555, confirm2, -1);
      // Those are just for double-checking functionality
      await createProvisionalAppointmentWithNonProvisionalAfterXDays(scopeIdentity, 777, confirm1, 0);
      await createProvisionalAppointmentWithNonProvisionalAfterXDays(scopeIdentity, 999, checkIn, -1);

      // 2. Act
      const missedAppts = await apptService.getAllYesterdayMissedAppointments();

      // 3. Assert
      expect(missedAppts).toHaveLength(2);
    });

    test('Returns unconfirmed non-provisional appointments within a threshold', async () => {
      // 1. Arrange
      const UnconfirmedStatuses = await Promise.all([
        lookupsService.getStatusIdByCode(scopeIdentity, AppointmentStatusEnum.SCHEDULE),
        lookupsService.getStatusIdByCode(scopeIdentity, AppointmentStatusEnum.CONFIRM1),
        lookupsService.getStatusIdByCode(scopeIdentity, AppointmentStatusEnum.CONFIRM2),
      ]).then((data) => [...data]);

      // Create 4 non-provisional appointment in recent time with check_in status
      const randomUnconfirmedStatus = () => UnconfirmedStatuses[Math.floor(Math.random() * UnconfirmedStatuses.length)];
      // Patient #1 (ID: 333, Today)
      await createProvisionalAppointmentWithNonProvisionalAfterXDays(scopeIdentity, 333, randomUnconfirmedStatus(), 0);
      // Patient #2 (ID: 555, Tomorrow)
      await createProvisionalAppointmentWithNonProvisionalAfterXDays(scopeIdentity, 555, randomUnconfirmedStatus(), 1);
      // Patient #3 (ID: 777, In 2 Days)
      await createProvisionalAppointmentWithNonProvisionalAfterXDays(scopeIdentity, 777, randomUnconfirmedStatus(), 2);
      // Patient #4 (ID: 999, In 3 Days)
      await createProvisionalAppointmentWithNonProvisionalAfterXDays(scopeIdentity, 999, randomUnconfirmedStatus(), 5);

      // 2. Act
      const unconfirmedAppts = await apptService.getAllUnconfirmedAppointmentInXDays(
        DEFAULT_APPOINTMENT_THRESHOLD_DAYS,
      );

      // 3. Assert
      // We expect 3 of these to be notified as the threshold is 3 days (including today)
      expect(unconfirmedAppts).toHaveLength(3);
    });

    test('Returns due provisional appointments with no scheduled appointments', async () => {
      // 1. Arrange
      // Provisional appointment #1 (Today)
      apptAttributes.patientId = 333;
      await apptService.createAppointment(scopeIdentity, apptAttributes, false);
      // Provisional appointment #2 (Due)
      apptAttributes.patientId = 555;
      apptAttributes.startDate = DateTime.now().minus({ days: 1 }).toISO();
      await apptService.createAppointment(scopeIdentity, apptAttributes, false);
      // Provisional appointment #3 (Due)
      apptAttributes.patientId = 777;
      apptAttributes.startDate = DateTime.now().minus({ days: 1 }).toISO();
      await apptService.createAppointment(scopeIdentity, apptAttributes, false);

      // 2. Act
      const dueProvisionalAppts = await apptService.getAllDueProvisionalAppointments();

      // 3. Assert
      expect(dueProvisionalAppts).toHaveLength(2);
    });
  });

  test('#getAppointmentsByPeriod', async () => {
    //Create two appointments
    const UnconfirmedStatuses = await Promise.all([
      lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.SCHEDULE),
      lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.CONFIRM1),
      lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.CONFIRM2),
    ]).then((data) => [...data]);

    const randomUnconfirmedStatus = () => UnconfirmedStatuses[Math.floor(Math.random() * UnconfirmedStatuses.length)];
    await createProvisionalAppointmentWithNonProvisionalAfterXDays(identity, 333, randomUnconfirmedStatus(), 1);
    await createProvisionalAppointmentWithNonProvisionalAfterXDays(identity, 555, randomUnconfirmedStatus(), 1, 5);
    await createProvisionalAppointmentWithNonProvisionalAfterXDays(identity, 777, randomUnconfirmedStatus(), 2);
    await createProvisionalAppointmentWithNonProvisionalAfterXDays(identity, 357, randomUnconfirmedStatus(), 3);

    const res = await apptService.getAppointmentsByPeriods(identity.clinicId, {
      fromDate: DateTime.now().startOf('day').toJSDate(),
      toDate: DateTime.now().plus({ months: 1 }).endOf('day').toJSDate(),
      doctorIds: [20],
    });

    expect(res).toHaveLength(3);
    expect(res[0].count).toEqual(2);
  });

  const createProvisionalAppointmentWithNonProvisionalAfterXDays = async (
    identity: IIdentity,
    patientId: number,
    statusId: number,
    days: number,
    hours?: number,
  ) => {
    const waitList = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.WAIT_LIST);
    // Attributes
    const apptAttributes: CreateAppointmentDto = {
      appointmentTypeId: 1,
      appointmentStatusId: waitList,
      patientId: 15,
      staffId: 20,
      startDate: new Date().toISOString(),
      durationMinutes: 60,
    };
    // Create Provisional
    apptAttributes.patientId = patientId;
    await apptService.createAppointment(identity, apptAttributes, false);
    // Non-Provisional
    apptAttributes.appointmentStatusId = statusId;
    apptAttributes.startDate = DateTime.now().toUTC().startOf('day').plus({ days, hours }).toISO(); // Tomorrow
    await apptService.createAppointment(identity, apptAttributes, false);
  };
});

describe('# Cancel appointment', () => {
  const identity = getTestIdentity(174, 174);
  let apptService: AppointmentsService;
  let moduleRef: TestingModule;
  let repo: typeof AppointmentsModel;
  let lookupsService: LookupsService;
  let availabilityService: AvailabilityService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule, ConfigurationModule, DatabaseModule, LookupsModule],
    }).compile();
    apptService = moduleRef.get<AppointmentsService>(AppointmentsService);
    repo = moduleRef.get<typeof AppointmentsModel>(APPOINTMENTS_REPOSITORY);
    availabilityService = moduleRef.get<AvailabilityService>(AvailabilityService);
    lookupsService = moduleRef.get<LookupsService>(LookupsService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });
  async function createAppointment(): Promise<AppointmentsModel> {
    await repo.destroy({ where: {} });
    return apptService.createAppointment(
      identity,
      {
        appointmentStatusId: 1,
        appointmentTypeId: 3,
        patientId: 15,
        staffId: 10,
        startDate: new Date().toISOString(),
        durationMinutes: 60,
      },
      true,
    );
  }

  test('cancelReason does not exist', async () => {
    const appt = await createAppointment();
    await expect(
      apptService.cancelAppointments(identity, [
        {
          appointmentId: appt.id,
          provisionalDate: '2091-10-10',
          reasonText: 'Bye Bye',
          reasonId: 10,
          keepAvailabiltySlot: true,
        },
      ]),
    ).rejects.toMatchObject({
      response: { fields: ['cancel_reschedule_reason_id', 'reasonId'], unknownIds: [10] },
    });
  });

  test('appointment does not exist', async () => {
    await expect(
      apptService.cancelAppointments(identity, [
        {
          appointmentId: 9999,
          provisionalDate: '2091-10-10',
          reasonText: 'ByeBye',
          keepAvailabiltySlot: true,
          reasonId: await lookupsService.getCancelRescheduleReasonByCode(identity, CancelRescheduleReasonCode.RELEASE),
        },
      ]),
    ).resolves.toMatchObject([{ status: 'FAIL' }]);
  });

  test('appointment canceled and availability is still active', async () => {
    await createAppointment();
    const appt = await apptService.createAppointment(
      identity,
      {
        appointmentStatusId: 2,
        appointmentTypeId: 3,
        patientId: 15,
        staffId: 20,
        startDate: new Date().toISOString(),
        durationMinutes: 15,
      },
      true,
    );
    await expect(
      apptService.cancelAppointments(identity, [
        {
          appointmentId: appt.id,
          reasonText: 'ByeBye',
          keepAvailabiltySlot: true,
          reasonId: await lookupsService.getCancelRescheduleReasonByCode(identity, CancelRescheduleReasonCode.RELEASE),
        },
      ]),
    ).resolves.toMatchObject([{ appointmentId: appt.id, status: 'OK' }]);

    await expect(availabilityService.findOne(appt.availabilityId)).resolves.toMatchObject({
      isOccupied: false,
      appointmentTypeId: 3,
      clinicId: identity.clinicId,
    });
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

// describe('# reschedule appointment', () => {
//   const identity = getTestIdentity(205, 205);
//   let apptService: AppointmentsService;
//   let moduleRef: TestingModule;
//   let repo: typeof AppointmentsModel;
//   let lookupsService: LookupsService;

//   beforeAll(async () => {
//     moduleRef = await Test.createTestingModule({
//       imports: [AppointmentsModule, ConfigurationModule, DatabaseModule, LookupsModule],
//     }).compile();
//     apptService = moduleRef.get<AppointmentsService>(AppointmentsService);
//     repo = moduleRef.get<typeof AppointmentsModel>(APPOINTMENTS_REPOSITORY);
//     lookupsService = moduleRef.get<LookupsService>(LookupsService);
//   });

//   afterAll(async () => {
//     await moduleRef.close();
//   });

//   async function createProvisionalAppt(): Promise<AppointmentsModel> {
//     await repo.destroy({ where: { clinicId: identity.clinicId } });
//     return apptService.createAppointment(
//       identity,
//       {
//         appointmentStatusId: 1,
//         appointmentTypeId: 3,
//         patientId: 981,
//         staffId: 110,
//         startDate: new Date().toISOString(),
//         durationMinutes: 60,
//       },
//       true,
//     );
//   }

//   // test('reschedule provisional appointment should throw an exception', async () => {
//   //   // Given ..
//   //   const appt = await createProvisionalAppt();
//   //   // When ..
//   //   const newDate = DateTime.now().plus({ days: 60 }).toISODate();
//   //   await expect(
//   //     apptService.rescheduleAppointment(identity, {
//   //       appointmentId: appt.id,
//   //       rescheduleReason: await lookupsService.getCancelRescheduleReasonByCode('DOCTOR_CHANGE'),
//   //       staffId: 20,
//   //       provisionalDate: newDate,
//   //     }),
//   //   ).resolves.toMatchObject({
//   //     staffId: 20,
//   //     durationMinutes: DEFAULT_EVENT_DURATION_MINS,
//   //   });
//   // });

//   // test('reschedule an actual appointment with a new provisonal date should cancel the current one, create a new appt and provisionsl', async () => {
//   //   // Given ..
//   //   const provisionalAppt = await createProvisionalAppt();
//   //   const appt = await apptService.createAppointment(
//   //     identity,
//   //     {
//   //       patientId: provisionalAppt.patientId,
//   //       staffId: provisionalAppt.staffId,
//   //       appointmentStatusId: await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.CONFIRM2),
//   //       appointmentTypeId: provisionalAppt.appointmentTypeId,
//   //       appointmentVisitModeId: await lookupsService.getVisitModeByCode(AppointmentVisitModeEnum.IN_PERSON),
//   //       durationMinutes: 30,
//   //       startDate: DateTime.now().plus({ days: 14 }).toISO(),
//   //     },
//   //     true,
//   //   );

//   //   // When ..
//   //   const rescheduled = await apptService.rescheduleAppointment(identity, {
//   //     appointmentId: appt.id,
//   //     rescheduleReason: await lookupsService.getCancelRescheduleReasonByCode('NO_SHOW_UP'),
//   //     rescheduleText: 'Missed the appointment',
//   //     durationMinutes: appt.durationMinutes,
//   //     startDate: DateTime.now().plus({ days: 30 }).toISODate(),
//   //   });

//   //   // Then ..
//   //   const canceledAppt = await apptService.findOne(appt.id);
//   //   const canceledProvisional = await apptService.findOne(provisionalAppt.id);

//   //   expect(rescheduled.id).not.toEqual(appt.id);
//   //   expect(canceledAppt).toMatchObject({
//   //     status: {
//   //       code: AppointmentStatusEnum.CANCELED,
//   //     },
//   //     availability: {
//   //       isOccupied: true,
//   //     },
//   //   });
//   //   expect(canceledProvisional).toMatchObject({
//   //     status: {
//   //       code: AppointmentStatusEnum.WAIT_LIST,
//   //     },
//   //   });
//   // });
// });

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
