import { IIdentity, PagingInfoInterface } from '@monmedx/monmedx-common';
import { BadRequestException, HttpModule, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  APPOINTMENTS_REPOSITORY,
  APPOINTMENT_CRON_JOB_REPOSITORY,
  APPOINTMENT_REQUEST_FEATURE_REPOSITORY,
  APPOINTMENT_REQUEST_REPOSITORY,
  AVAILABILITY_REPOSITORY,
  DEFAULT_APPOINTMENT_THRESHOLD_DAYS,
  PATIENT_INFO_REPOSITORY,
  SEQUELIZE,
} from 'common/constants';
import { AppointmentStatusEnum, AppointmentVisitModeEnum, CancelRescheduleReasonCode, ErrorCodes } from 'common/enums';
import { DateTime } from 'luxon';
import {
  getAppointmentByPatientIdTestCases,
  getAppointmentWithActionsTestCases,
  getPatientAppointmentsTestData,
  getPatientHistoryTestCases,
  getPatientHistoryTestData,
  getReleasePatientInfoAfterCompleteVisit,
} from 'modules/appointments/__tests__/appointment.data';
import { AvailabilityService } from 'modules/availability/availability.service';
import { CreateAvailabilityDto } from 'modules/availability/dto/create.dto';
import { ConfigurationModule } from 'modules/config/config.module';
import { DatabaseModule } from 'modules/database/database.module';
import { LookupsModule } from 'modules/lookups/lookups.module';
import { LookupsService } from 'modules/lookups/lookups.service';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { getPatientTestIdentity, getTestIdentity } from 'utils/test-helpers/common-data-helpers';
import { PatientStatus } from '../../../common/enums/patient-status';
import { AppointmentCronJobModel } from '../../appointment-cron-job/appointment-cron-job.model';
import { AppointmentCronJobService } from '../../appointment-cron-job/appointment-cron-job.service';
import { AppointmentRequestsService } from '../../appointment-requests/appointment-requests.service';
import { AppointmentRequestFeatureStatusModel, AppointmentRequestsModel } from '../../appointment-requests/models';
import { AvailabilityValidator } from '../../availability/availability.validator';
import { AvailabilityModel } from '../../availability/models/availability.model';
import { ClinicSettingsModule } from '../../clinic-settings/clinic-settings.module';
import { EventsModule } from '../../events/events.module';
import { PatientInfoService } from '../../patient-info';
import { PatientInfoModel } from '../../patient-info/patient-info.model';
import { AppointmentEventPublisher } from '../appointments.event-publisher';
import { AppointmentsModel, AppointmentsModelAttributes } from '../appointments.model';
import { AppointmentsService } from '../appointments.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { QueryParamsDto } from '../dto/query-params.dto';

const identity: IIdentity = getTestIdentity(42, 5000);

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
    expect(actionsResult[0]?.nextAction?.code).toEqual(testCase.Primary[0]);
  });

  test.each(getAppointmentWithActionsTestCases())('#checkAppointmentsActions Secondary: %p', async (testCase) => {
    const actionsResult: any = await lookupsService.findAppointmentsActions([testCase.statusId]);
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
    moduleRef = await createAppointmentTestModule();
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
    let appointmentAttributes: CreateAppointmentDto;

    beforeEach(async () => {
      appointmentAttributes = {
        appointmentStatusId: await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.READY),
        appointmentTypeId: 1,
        patientId: 15,
        staffId: 20,
        startDate: new Date().toISOString(),
        durationMinutes: 60,
      };
      await AvailabilityModel.destroy({ where: {} });
      await AppointmentsModel.destroy({ where: {} });
    });

    test('Creating an appointment without availabilityId or startDate & durationMinutes & appointmentTypeId', async (done) => {
      delete appointmentAttributes.startDate;
      delete appointmentAttributes.durationMinutes;
      try {
        await apptService.createAppointment(identity, appointmentAttributes, true);
      } catch (err) {
        expect(err.message).toMatch(
          "You didn't provide availabilityId you must provide: startDate, durationMinutes and appointmentTypeId",
        );
      }
      done();
    });

    test('Fails providing no availabilityId with startDate & durationDuration but no appointmentTypeId', async (done) => {
      delete appointmentAttributes.appointmentTypeId;
      try {
        await apptService.createAppointment(identity, appointmentAttributes, true);
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

      expect(createdAppointment.staffId).toBe(333);
      expect(createdAppointment.appointmentTypeId).toBe(2);

      const availabilityAfterUpdate = await availabilityService.findOne(createdAvailability.id);
      expect(availabilityAfterUpdate.isOccupied).toBe(true);
    });

    test('Fails if creating a provisional appointment while the patient has an existent one', async (done) => {
      // Create patient with provisional
      await expect(apptService.createAppointment(identity, appointmentAttributes, true)).resolves.toBeDefined();
      // Create provisional again w/ same patient
      try {
        await apptService.createAppointment(identity, appointmentAttributes, true);
      } catch (err) {
        expect(err.message).toEqual('Patient already has a provisional appointment');
      }
      done();
    });

    test('Fails if provided availbilityId corresponding to non-existent availability', async () => {
      delete appointmentAttributes.startDate;
      delete appointmentAttributes.durationMinutes;
      appointmentAttributes.availabilityId = 3579;
      const action = apptService.createAppointment(identity, appointmentAttributes, true);
      await expect(action).rejects.toThrow('This availability does not exits!');
    });

    test('Fails provided invalid status id', async () => {
      appointmentAttributes.appointmentStatusId = 3579;
      const action = apptService.createAppointment(identity, appointmentAttributes, true);
      await expect(action).rejects.toThrow('unknown appointment status ID');
    });

    test('Succeeds providing valid startDate, durationMinutes, appointmentTypeId', async () => {
      const action = apptService.createAppointment(identity, appointmentAttributes, true);
      const res = await action;
      expect(res.appointmentTypeId).toBe(appointmentAttributes.appointmentTypeId);
      expect(res.startDate.toISOString()).toBe(appointmentAttributes.startDate);
      expect(res.durationMinutes).toBe(appointmentAttributes.durationMinutes);
      expect(res.availabilityId).toBeDefined();
    });

    test('Succeed providing valid availability id and other inputs', async () => {
      const tempTransaction = await sequelize.transaction();
      const availabilityAttributes: CreateAvailabilityDto = {
        staffId: appointmentAttributes.staffId,
        appointmentTypeId: appointmentAttributes.appointmentTypeId,
        durationMinutes: appointmentAttributes.durationMinutes,
        startDate: appointmentAttributes.startDate,
      };
      // Create one availability and access it
      const createdAvailability = (
        await availabilityService.bulkCreate([availabilityAttributes], identity, tempTransaction)
      )[0];
      await tempTransaction.commit();
      // Assign newly created availabilty to appointment attributes
      appointmentAttributes.availabilityId = createdAvailability.id;
      const res = await apptService.createAppointment(identity, appointmentAttributes, true);
      expect(res).toBeDefined();
      expect(res.staffId).toBe(appointmentAttributes.staffId);
      expect(res.durationMinutes).toEqual(createdAvailability.durationMinutes);
    });

    test('Succeeds in creating non-provisional appointment if an existing provisional appointment exists for same patient', async () => {
      delete appointmentAttributes.appointmentStatusId; // Defaults to provisional if not status id not provided
      const provisionalAppointment = await apptService.createAppointment(identity, appointmentAttributes, true);
      appointmentAttributes.startDate = new Date('2100-01-01').toISOString();
      appointmentAttributes.appointmentStatusId = 2;
      const nonProvisionalAppointment = await apptService.createAppointment(identity, appointmentAttributes, true);
      expect(nonProvisionalAppointment.provisionalDate.toISOString()).toMatch(
        provisionalAppointment.startDate.toISOString().split('.')[0],
      );
      expect(nonProvisionalAppointment.appointmentStatusId).toEqual(2);
      expect(nonProvisionalAppointment.startDate.toISOString()).toMatch(appointmentAttributes.startDate.split('.')[0]);
      // Get created availability
      const availability = await availabilityService.findOne(nonProvisionalAppointment.availabilityId);
      expect(availability).toBeDefined();
    });

    test("Create appointment via adhoc: patient don't have appointment that day", async () => {
      const todayDate = new Date();
      const futureDate = DateTime.fromJSDate(todayDate).plus({ days: 5 }).toJSDate();
      appointmentAttributes.startDate = futureDate.toISOString();
      const appointment = await apptService.createAppointment(identity, appointmentAttributes, true);
      const adhocAppointment = await apptService.adhocAppointment(identity, {
        patientId: appointmentAttributes.patientId,
        date: todayDate,
        modeCode: AppointmentVisitModeEnum.PHONE,
      });
      const cancelledAppointment = await apptService.findOne(identity, appointment.id);
      expect(cancelledAppointment.cancelRescheduleReasonId).toEqual(
        await lookupsService.getCancelRescheduleReasonByCode(identity, CancelRescheduleReasonCode.OTHER),
      );
      expect(cancelledAppointment.cancelRescheduleText).toEqual('Ad-hoc appointment initiated');
      expect(adhocAppointment).toBeDefined();
      expect(adhocAppointment.appointmentVisitModeId).toEqual(
        await lookupsService.getVisitModeByCode(AppointmentVisitModeEnum.PHONE),
      );
      expect(adhocAppointment.startDate).toEqual(todayDate);
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

    const res = await apptService.getAppointmentsByPeriods(identity, {
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
  let appointmentsService: AppointmentsService;
  let patientInfoService: PatientInfoService;
  let moduleRef: TestingModule;
  let lookupsService: LookupsService;
  let availabilityService: AvailabilityService;

  beforeAll(async () => {
    moduleRef = await createAppointmentTestModule();
    appointmentsService = moduleRef.get<AppointmentsService>(AppointmentsService);
    availabilityService = moduleRef.get<AvailabilityService>(AvailabilityService);
    lookupsService = moduleRef.get<LookupsService>(LookupsService);
    patientInfoService = moduleRef.get<PatientInfoService>(PatientInfoService);
    await Promise.all([
      AvailabilityModel.destroy({ where: {} }),
      AppointmentsModel.destroy({ where: {} }),
      PatientInfoModel.destroy({ truncate: true }),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      AvailabilityModel.destroy({ where: {} }),
      AppointmentsModel.destroy({ where: {} }),
      PatientInfoModel.destroy({ where: {} }),
    ]);
    await moduleRef.close();
  });

  async function createAppointment(): Promise<AppointmentsModel> {
    await AppointmentsModel.destroy({ where: {} });
    return appointmentsService.createAppointment(
      identity,
      {
        appointmentStatusId: await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.READY),
        appointmentTypeId: 3,
        patientId: 15,
        staffId: 10,
        startDate: new Date().toISOString(),
        durationMinutes: 60,
      },
      true,
    );
  }

  test('# cancelReason does not exist', async () => {
    const appointment = await createAppointment();
    const unknownId = 1000;
    try {
      await appointmentsService.cancelAppointment(identity, {
        appointmentId: appointment.id,
        provisionalDate: '2091-10-10',
        cancelReasonText: 'Bye Bye',
        cancelReasonId: unknownId,
        keepAvailabiltySlot: true,
      });
      fail("Shouldn't have made it here");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.response).toHaveProperty('message', `Unknown cancel reason`);
      expect(error.response).toHaveProperty('code', ErrorCodes.BAD_REQUEST);
      expect(error.response).toHaveProperty('fields', ['cancel_reschedule_reason_id', 'reasonId']);
      expect(error.response).toHaveProperty('unknownId', unknownId);
    }
  });

  test('# Services defined', () => {
    expect(appointmentsService).toBeDefined();
    expect(lookupsService).toBeDefined();
    expect(patientInfoService).toBeDefined();
    expect(availabilityService).toBeDefined();
  });

  test('# appointment does not exist', async () => {
    const appointmentId = 99999;
    try {
      const cancelReasonId = await lookupsService.getCancelRescheduleReasonByCode(
        identity,
        CancelRescheduleReasonCode.RELEASE_PATIENT,
      );
      await appointmentsService.cancelAppointment(identity, {
        appointmentId,
        provisionalDate: '2091-10-10',
        cancelReasonText: 'ByeBye',
        keepAvailabiltySlot: true,
        cancelReasonId,
      });
      fail("Shouldn't have made it here");
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.response).toHaveProperty('message', `Appointment with id = ${appointmentId} not found`);
      expect(error.response).toHaveProperty('code', ErrorCodes.NOT_FOUND);
      expect(error.response).toHaveProperty('fields', ['appointmentId']);
    }
  });

  test('# appointment canceled and availability is still active', async () => {
    await createAppointment();
    const appt = await appointmentsService.createAppointment(
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

    const cancelReasonText = 'ByeBye';
    const cancelReasonId = await lookupsService.getCancelRescheduleReasonByCode(
      identity,
      CancelRescheduleReasonCode.RELEASE_PATIENT,
    );

    await appointmentsService.cancelPatientAppointments(
      identity,
      appt.patientId,
      cancelReasonId,
      cancelReasonText,
      true,
      null,
    );
    const updatedAppointment = await appointmentsService.findOne(identity, appt.id);
    expect(updatedAppointment.cancelRescheduleReasonId).toEqual(cancelReasonId);
    expect(updatedAppointment.cancelRescheduleText).toEqual(cancelReasonText);

    await expect(availabilityService.findOne(appt.availabilityId)).resolves.toMatchObject({
      isOccupied: false,
      appointmentTypeId: 3,
      clinicId: identity.clinicId,
    });
  });

  test('# Cancel appointment with reason RELEASE_PATIENT will set patient and appointment status to RELEASED', async () => {
    const patientInfo = await patientInfoService.create(getReleasePatientInfoAfterCompleteVisit());
    const identity = getTestIdentity(546, patientInfo.clinicId);
    const readyStatusId = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.READY);
    const appointment = await appointmentsService.createAppointment(
      identity,
      {
        appointmentTypeId: 1,
        durationMinutes: 30,
        patientId: patientInfo.id,
        staffId: 1,
        startDate: '2021-10-25T07:43:40.084Z',
        appointmentStatusId: readyStatusId,
      },
      true,
    );

    const releasedStatusId = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.RELEASED);
    const releaseReasonId = await lookupsService.getCancelRescheduleReasonByCode(
      identity,
      CancelRescheduleReasonCode.RELEASE_PATIENT,
    );

    const updatedAppointment = await appointmentsService.cancelAppointment(identity, {
      appointmentId: appointment.id,
      cancelReasonId: releaseReasonId,
      cancelReasonText: '',
      keepAvailabiltySlot: false,
    });
    expect(updatedAppointment.appointmentStatusId).toEqual(releasedStatusId);
    const updatedPatientInfo = await patientInfoService.getById(patientInfo.id);
    expect(updatedPatientInfo.statusCode).toEqual(PatientStatus.RELEASED);
  });

  test('# Reschedule current active appointment and create a new one', async () => {
    const appointment = await createAppointment();
    const appointmentTypeId = await lookupsService.getFUBAppointmentTypeId(identity);
    const readyStatusId = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.READY);
    const rescheduledId = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.RESCHEDULED);
    const rescheduleReasonText = 'create new appointment';
    const rescheduleReasonId = await lookupsService.getCancelRescheduleReasonByCode(
      identity,
      CancelRescheduleReasonCode.CHANGE_DOCTOR,
    );
    const newAppointment = await appointmentsService.createPatientAppointment(
      identity,
      {
        patientId: appointment.patientId,
        staffId: 606,
        appointmentTypeId,
        appointmentStatusId: readyStatusId,
        startDate: appointment.startDate.toISOString(),
        durationMinutes: 20,
      },
      true,
      rescheduleReasonId,
      rescheduleReasonText,
    );

    expect(newAppointment.appointmentStatusId).toEqual(readyStatusId);

    const rescheduledAppointment = await appointmentsService.findOne(identity, appointment.id);
    expect(rescheduledAppointment.cancelRescheduleText).toEqual(rescheduleReasonText);
    expect(rescheduledAppointment.cancelRescheduleReasonId).toEqual(rescheduleReasonId);
    expect(rescheduledAppointment.appointmentStatusId).toEqual(rescheduledId);
  });

  test('# Reschedule current appointment and create a new one using availability', async () => {
    const availability = await availabilityService.createSingleAvailability(identity, {
      appointmentTypeId: 1,
      durationMinutes: 15,
      staffId: 1,
      startDate: '2021-10-25T07:43:40.084Z',
    });
    const appointment = await createAppointment();
    const appointmentTypeId = await lookupsService.getFUBAppointmentTypeId(identity);
    const scheduleStatusId = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.SCHEDULE);
    const rescheduledId = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.RESCHEDULED);
    const rescheduleReasonText = 'create new appointment';
    const rescheduleReasonId = await lookupsService.getCancelRescheduleReasonByCode(
      identity,
      CancelRescheduleReasonCode.CHANGE_DOCTOR,
    );
    const newAppointment = await appointmentsService.createPatientAppointment(
      identity,
      {
        patientId: appointment.patientId,
        staffId: 606,
        appointmentTypeId,
        availabilityId: availability.id,
      },
      true,
      rescheduleReasonId,
      rescheduleReasonText,
    );

    expect(newAppointment.appointmentStatusId).toEqual(scheduleStatusId);

    const rescheduledAppointment = await appointmentsService.findOne(identity, appointment.id);
    expect(rescheduledAppointment.cancelRescheduleText).toEqual(rescheduleReasonText);
    expect(rescheduledAppointment.cancelRescheduleReasonId).toEqual(rescheduleReasonId);
    expect(rescheduledAppointment.appointmentStatusId).toEqual(rescheduledId);
  });
});

describe('# Patient appointment history tests', () => {
  const identity = getTestIdentity(174, 174);
  let appointmentsService: AppointmentsService;
  let moduleRef: TestingModule;
  let repo: typeof AppointmentsModel;
  let createdAppointmentsIds = [];

  beforeAll(async () => {
    moduleRef = await createAppointmentTestModule();
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

describe('# reschedule appointment', () => {
  const identity = getTestIdentity(205, 205);
  let apptService: AppointmentsService;
  let moduleRef: TestingModule;
  let repo: typeof AppointmentsModel;
  let lookupsService: LookupsService;
  let availabilitySvc: AvailabilityService;

  beforeAll(async () => {
    moduleRef = await createAppointmentTestModule();
    apptService = moduleRef.get<AppointmentsService>(AppointmentsService);
    availabilitySvc = moduleRef.get<AvailabilityService>(AvailabilityService);
    repo = moduleRef.get<typeof AppointmentsModel>(APPOINTMENTS_REPOSITORY);
    lookupsService = moduleRef.get<LookupsService>(LookupsService);
  });

  afterAll(async () => {
    await repo.destroy({ where: { clinicId: identity.clinicId } });
    await moduleRef.close();
  });

  test(
    'reschedule an appointment with a new provisional date should set the current one status to RESCHEDULED,' +
      ' create a new appointment with Scheduled Status',
    async () => {
      // Given ..
      const appointment = await apptService.createAppointment(
        identity,
        {
          patientId: 981,
          staffId: 110,
          appointmentStatusId: await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.CONFIRM2),
          appointmentTypeId: await lookupsService.getFUBAppointmentTypeId(identity),
          appointmentVisitModeId: await lookupsService.getVisitModeByCode(AppointmentVisitModeEnum.IN_PERSON),
          durationMinutes: 30,
          startDate: DateTime.now().plus({ days: 14 }).toISO(),
        },
        true,
      );

      // When ..
      const newDate = DateTime.now().plus({ days: 30 });
      const rescheduled = await apptService.rescheduleAppointment(identity, {
        appointmentId: appointment.id,
        rescheduleReason: await lookupsService.getCancelRescheduleReasonByCode(
          identity,
          CancelRescheduleReasonCode.DOCTOR_UNAVAILABLE,
        ),
        keepAvailabilitySlot: false,
        rescheduleText: 'Missed the appointment',
        durationMinutes: appointment.durationMinutes,
        startDate: newDate.toISODate(),
      });

      // Then ..
      const canceledAppt = await apptService.findOne(identity, appointment.id);

      await expect(rescheduled.id).not.toEqual(appointment.id);
      const rescheduleStatusId = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.SCHEDULE);
      await expect(rescheduled).toMatchObject({
        appointmentStatusId: rescheduleStatusId,
      });
      await expect(canceledAppt).toMatchObject({
        status: {
          code: AppointmentStatusEnum.RESCHEDULED,
        },
        availability: {
          isOccupied: true,
        },
      });
    },
  );

  test('reschedule appointment to new availabilityId info', async () => {
    // Given ..
    const appt = await apptService.createAppointment(
      identity,
      {
        patientId: 981,
        staffId: 110,
        appointmentStatusId: await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.CONFIRM2),
        appointmentTypeId: 2,
        appointmentVisitModeId: await lookupsService.getVisitModeByCode(AppointmentVisitModeEnum.IN_PERSON),
        durationMinutes: 30,
        startDate: DateTime.now().plus({ days: 14 }).toISO(),
      },
      true,
    );

    const newDate = DateTime.now().plus({ days: 5 });
    const availability = await availabilitySvc.createSingleAvailability(identity, {
      startDate: newDate.toISO(),
      staffId: 333,
      appointmentTypeId: 1,
      durationMinutes: 30,
    });

    // When ..
    const rescheduled = await apptService.rescheduleAppointment(identity, {
      availabilityId: availability.id,
      appointmentId: appt.id,
      rescheduleReason: await lookupsService.getCancelRescheduleReasonByCode(
        identity,
        CancelRescheduleReasonCode.DOCTOR_UNAVAILABLE,
      ),
      rescheduleText: 'Missed the appointment',
    });

    await expect(rescheduled).toMatchObject({
      durationMinutes: 30,
      staffId: 333,
      availabilityId: availability.id,
    });
  });

  test('reschedule appointment to a new doctor should cancel the current appointments doctor', async () => {
    // Given ..
    const readyStatus = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.READY);
    const appt = await apptService.createAppointment(
      identity,
      {
        patientId: 500,
        staffId: 345,
        appointmentStatusId: readyStatus,
        appointmentTypeId: 1,
        startDate: '2021-09-10T12:00:00.000Z',
        durationMinutes: 30,
      },
      true,
    );

    // When ..
    const changeDoctorReason = await lookupsService.getCancelRescheduleReasonByCode(
      identity,
      CancelRescheduleReasonCode.CHANGE_DOCTOR,
    );
    const rescheduled = await apptService.rescheduleAppointment(identity, {
      appointmentId: appt.id,
      rescheduleReason: changeDoctorReason,
      durationMinutes: 30,
      startDate: '2021-09-10T12:00:00.000Z',
      staffId: 542,
    });

    // Then ..
    const canceled = await apptService.findOne(identity, appt.id);
    const canceledStatus = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.RESCHEDULED);
    expect(rescheduled.staffId).toBe(542);
    expect(canceled.appointmentStatusId).toBe(canceledStatus);
  });

  test('reschedule appointment to a new doctor using availability should set the current appointment to RESCHEDULED and free up the availability', async () => {
    // Given ..
    const readyStatus = await lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.READY);
    const appt = await apptService.createAppointment(
      identity,
      {
        patientId: 600,
        staffId: 620,
        appointmentStatusId: readyStatus,
        appointmentTypeId: 1,
        startDate: '2021-09-10T12:00:00.000Z',
        durationMinutes: 30,
      },
      true,
    );

    const staff2Availability = await availabilitySvc.createSingleAvailability(identity, {
      appointmentTypeId: 1,
      durationMinutes: 30,
      startDate: '2021-09-11T11:00:00.000Z',
      staffId: 630,
    });

    // When ..
    const changeDoctorReason = await lookupsService.getCancelRescheduleReasonByCode(
      identity,
      CancelRescheduleReasonCode.CHANGE_DOCTOR,
    );
    const rescheduled = await apptService.rescheduleAppointment(identity, {
      appointmentId: appt.id,
      rescheduleReason: changeDoctorReason,
      availabilityId: staff2Availability.id,
    });

    // Then ..
    const canceled = await apptService.findOne(identity, appt.id);
    const [canceledStatus, scheduleStatus] = await Promise.all([
      lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.RESCHEDULED),
      lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.SCHEDULE),
    ]);
    expect(rescheduled.staffId).toBe(630);
    expect(rescheduled.appointmentStatusId).toBe(scheduleStatus);
    expect(canceled.appointmentStatusId).toBe(canceledStatus);
    expect(canceled.availabilityId).toBeDefined();

    // And ..
    const canceledAvailability = await availabilitySvc.findOne(appt.availabilityId);
    const usedAvailability = await availabilitySvc.findOne(staff2Availability.id);
    expect(canceledAvailability.isOccupied).toBeTruthy();
    expect(usedAvailability.isOccupied).toBeTruthy();
    expect(rescheduled.availabilityId).toBe(staff2Availability.id);
  });
});

describe('Patient upcoming and next appointments tests', () => {
  const identity = getTestIdentity(295, 295);
  let appointmentsService: AppointmentsService;
  let moduleRef: TestingModule;
  let repo: typeof AppointmentsModel;
  let createdAppointmentsIds = [];

  beforeAll(async () => {
    moduleRef = await createAppointmentTestModule();
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
    const result = await appointmentsService.getAppointmentByPatientId(identity, testCase.patientId);
    expect(result?.startDate).toEqual(testCase.date);
  });
});

describe('Appointment service for patient scope', () => {
  const staffIdentity = getTestIdentity(948, 948);
  const patientIdentity = getPatientTestIdentity(949, 948);
  let appointmentsService: AppointmentsService;
  let lookupsService: LookupsService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await createAppointmentTestModule();
    appointmentsService = moduleRef.get<AppointmentsService>(AppointmentsService);
    lookupsService = moduleRef.get<LookupsService>(LookupsService);
  });

  afterEach(async () => {
    await Promise.all([AvailabilityModel.destroy({ where: {} }), AppointmentsModel.destroy({ where: {} })]);
    await moduleRef.close();
  });

  test('# find patient by id using patient identity', async () => {
    const appointment = await appointmentsService.createAppointment(
      staffIdentity,
      {
        appointmentStatusId: await lookupsService.getStatusIdByCode(staffIdentity, AppointmentStatusEnum.SCHEDULE),
        appointmentVisitModeId: 1,
        complaintsNotes: 'asdasd',
        appointmentTypeId: await lookupsService.getFUBAppointmentTypeId(staffIdentity),
        durationMinutes: 15,
        patientId: patientIdentity.userId,
        staffId: 15,
        startDate: '2022-12-12T15:00:00.000Z',
      },
      true,
    );
    const result = await appointmentsService.findOne(patientIdentity, appointment.id);
    expect(Object.keys(result).sort()).toEqual(
      [
        '__typename',
        'hasPendingAppointmentRequest',
        'id',
        'clinicId',
        'patientId',
        'staffId',
        'previousAppointmentId',
        'startDate',
        'endDate',
        'durationMinutes',
        'upcomingAppointment',
        'complaintsNotes',
        'appointmentRequestId',
        'appointmentRequestDate',
        'appointmentToken',
        'patient',
        'type',
        'status',
        'visitMode',
        'appointmentRequest',
        'appointmentTypeId',
        'appointmentStatusId',
        'appointmentVisitModeId',
      ].sort(),
    );
  });
});

function createAppointmentTestModule() {
  return Test.createTestingModule({
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
}
