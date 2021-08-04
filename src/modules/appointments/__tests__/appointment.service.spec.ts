import { IIdentity, PagingInfoInterface } from '@dashps/monmedx-common';
import { Test, TestingModule } from '@nestjs/testing';
import { APPOINTMENTS_REPOSITORY, SEQUELIZE } from 'common/constants';
import { AvailabilityService } from 'modules/availability/availability.service';
import { CreateAvailabilityDto } from 'modules/availability/dto/create.dto';
import { ConfigurationModule } from 'modules/config/config.module';
import { DatabaseModule } from 'modules/database/database.module';
import { Sequelize } from 'sequelize-typescript';
import { AppointmentsModel } from '../appointments.model';
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

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppointmentsModule, ConfigurationModule, DatabaseModule],
    }).compile();

    apptService = moduleRef.get<AppointmentsService>(AppointmentsService);
    sequelize = moduleRef.get<Sequelize>(SEQUELIZE);
    repo = moduleRef.get<typeof AppointmentsModel>(APPOINTMENTS_REPOSITORY);
    availabilityService = moduleRef.get<AvailabilityService>(AvailabilityService);
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
    });
  });
});
