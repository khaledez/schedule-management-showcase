import { BadRequestException, CacheModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  APPOINTMENT_CANCEL_RESCHEDULE_REASON_REPOSITORY,
  APPOINTMENT_STATUS_LOOKUPS_REPOSITORY,
  APPOINTMENT_TYPES_LOOKUPS_REPOSITORY,
  APPOINTMENT_VISIT_MODE_LOOKUP_REPOSITORY,
  BAD_REQUEST,
} from 'common/constants';
import { ConfigurationModule } from 'modules/config/config.module';
import { DatabaseModule } from 'modules/database/database.module';
import { LookupsModule } from 'modules/lookups/lookups.module';
import { lookupsProviders } from 'modules/lookups/lookups.provider';
import { LookupsService } from 'modules/lookups/lookups.service';
import {
  appointmentCancelRescheduleReasonLookups,
  appointmentStatusLookupData,
  appointmentTypesLookupData,
  appointmentVisitModeLookupData,
} from 'modules/lookups/__tests__/lookups.data';
import { getTestIdentity } from 'utils/test-helpers/common-data-helpers';
import { IIdentity } from '@monmedx/monmedx-common';
import {
  AppointmentStatusEnum,
  AppointmentTypesEnum,
  CancelRescheduleReasonCode,
  ErrorCodes,
} from '../../../common/enums';

describe('LookupsService', () => {
  let lookupsService: LookupsService;

  const testLookupProviders = [
    { provide: APPOINTMENT_TYPES_LOOKUPS_REPOSITORY, data: appointmentTypesLookupData() },
    { provide: APPOINTMENT_VISIT_MODE_LOOKUP_REPOSITORY, data: appointmentVisitModeLookupData() },
    { provide: APPOINTMENT_STATUS_LOOKUPS_REPOSITORY, data: appointmentStatusLookupData() },
    { provide: APPOINTMENT_CANCEL_RESCHEDULE_REASON_REPOSITORY, data: appointmentCancelRescheduleReasonLookups() },
  ].map((entry: { provide: string; data: any[] }) => {
    return {
      ...entry,
      useValue: {
        findAll: jest.fn(({ where }) => {
          if (where?.id) {
            if (Array.isArray(where.id)) {
              return entry.data.filter((val) => where.id.includes(val.id));
            }
            return entry.data.filter((val) => val.id === where.id);
          }
          return entry.data;
        }),
        findByPk: jest.fn((id) => {
          const filtered = entry.data.filter((value) => value.id === id);
          return filtered.length !== 0 ? filtered[0] : null;
        }),
      },
    };
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register({ ttl: 60 * 60 /* 1 hour */ })],
      providers: [LookupsService, ...lookupsProviders, ...testLookupProviders],
    }).compile();
    lookupsService = await module.get<LookupsService>(LookupsService);
  });

  test('should be defined', () => {
    expect(lookupsService).toBeDefined();
  });

  test.each([{ ids: null }, { ids: [] }, { ids: [1, 2, 3], willThrowException: false }])(
    '# validateAppointmentsTypes valid ids: %p',
    async (testCase) => {
      await lookupsService.validateAppointmentsTypes(getTestIdentity(50, 50), testCase.ids);
    },
  );

  test.each([
    { ids: [5, 6, 7], notFoundIds: [5, 6, 7] },
    { ids: [2, 3, 4], notFoundIds: [4] },
  ])('# validateAppointmentsTypes has invalid ids: %p', async (testCase) => {
    try {
      await lookupsService.validateAppointmentsTypes(getTestIdentity(50, 50), testCase.ids);
      fail("Shouldn't have made it here");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response).toHaveProperty('message', `The appointment types doesn't exist: [${testCase.notFoundIds}]`);
      expect(err.response).toHaveProperty('code', BAD_REQUEST);
    }
  });

  // Visit mode validate tests
  test('appointmentVisitMode validate empty ids', async () => {
    await Promise.all([
      expect(lookupsService.validateAppointmentVisitModes(getTestIdentity(50, 50), [])).resolves.toBeUndefined(),
      expect(lookupsService.validateAppointmentVisitModes(getTestIdentity(50, 50), null)).resolves.toBeUndefined(),
      expect(lookupsService.validateAppointmentVisitModes(getTestIdentity(50, 50), [null])).rejects.toThrow(
        /unknown visit mode ID/,
      ),
    ]);
  });

  test.each([
    { input: [7, 8], unknownIds: [7, 8] },
    { input: [1, 2, 5, 6], unknownIds: [5, 6] },
    { input: [6, 7, 8], unknownIds: [6, 7, 8] },
  ])('appointmentVisitMode validate not found ids %#', async ({ input, unknownIds }) => {
    await expect(lookupsService.validateAppointmentVisitModes(getTestIdentity(50, 50), input)).rejects.toMatchObject({
      response: { fields: ['appointmentVisitModeId'], unknownIds },
    });
  });

  test('appointmentCancelRescheduleReason validate empty ids', async () => {
    await Promise.all([
      expect(
        lookupsService.validateAppointmentCancelRescheduleReason(getTestIdentity(50, 50), []),
      ).resolves.toBeUndefined(),
      expect(
        lookupsService.validateAppointmentCancelRescheduleReason(getTestIdentity(50, 50), null),
      ).resolves.toBeUndefined(),
      expect(lookupsService.validateAppointmentCancelRescheduleReason(getTestIdentity(50, 50), [null])).rejects.toThrow(
        /unknown cancel reschedule reason ID/,
      ),
    ]);
  });

  test.each([
    { input: [7, 8], unknownIds: [7, 8] },
    { input: [1, 2, 5, 6], unknownIds: [5, 6] },
    { input: [6, 7, 8], unknownIds: [6, 7, 8] },
  ])('appointmentCancelRescheduleReason validate not found ids %p', async ({ input, unknownIds }) => {
    await expect(
      lookupsService.validateAppointmentCancelRescheduleReason(getTestIdentity(50, 50), input),
    ).rejects.toMatchObject({ response: { fields: ['cancel_reschedule_reason_id', 'reasonId'], unknownIds } });
  });
});

describe('LookupsService with sequelize', () => {
  let lookupsService: LookupsService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule, LookupsModule],
    }).compile();
    lookupsService = await module.get<LookupsService>(LookupsService);
  });

  afterAll(async () => {
    await module.close();
  });

  test('# getProvisionalAppointmentStatusId: will return result', async () => {
    const result = await lookupsService.getProvisionalAppointmentStatusId(getTestIdentity(136, 136));
    expect(result).toBeDefined();
  });

  test('# getNewAppointmentTypeId: will return result', async () => {
    const result = await lookupsService.getFUBAppointmentTypeId(getTestIdentity(155, 155));
    expect(result).toBeDefined();
  });
});

describe('# Cancel Reschedule Reasons', () => {
  let service: LookupsService;
  let testModule: TestingModule;
  const identity: IIdentity = getTestIdentity(161, 161);

  beforeAll(async () => {
    testModule = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule, LookupsModule],
    }).compile();
    service = await testModule.get<LookupsService>(LookupsService);
  });

  afterAll(async () => {
    await testModule.close();
  });

  test('# validateAppointmentRescheduleReasons: passing null or empty array', async () => {
    await service.validateAppointmentRescheduleReasons(identity, null);
    await service.validateAppointmentRescheduleReasons(identity, []);
  });

  test('# validateAppointmentRescheduleReasons: valid input', async () => {
    const rescheduleReasonsCodes = [
      CancelRescheduleReasonCode.CHANGE_DOCTOR,
      CancelRescheduleReasonCode.DOCTOR_UNAVAILABLE,
      CancelRescheduleReasonCode.PATIENT_CANNOT_MAKE_IT,
      CancelRescheduleReasonCode.NO_SHOW_UP,
      CancelRescheduleReasonCode.OTHER,
    ].map((code) => code.toString());
    const reasons = await service.findAllAppointmentCancelRescheduleReasons(identity);
    const ids = reasons.filter((reason) => rescheduleReasonsCodes.includes(reason.code)).map((reason) => reason.id);
    await service.validateAppointmentRescheduleReasons(identity, ids);
  });

  test('# validateAppointmentRescheduleReasons: invalid input', async () => {
    const rescheduleReasonsCodes = [
      CancelRescheduleReasonCode.ABORT_VISIT,
      CancelRescheduleReasonCode.RELEASE_PATIENT,
    ].map((code) => code.toString());
    const reasons = await service.findAllAppointmentCancelRescheduleReasons(identity);
    const ids = reasons.filter((reason) => rescheduleReasonsCodes.includes(reason.code)).map((reason) => reason.id);
    try {
      await service.validateAppointmentRescheduleReasons(identity, ids);
      fail("Shouldn't have made it here");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.response).toHaveProperty('message', `unknown reschedule reason ID`);
      expect(error.response).toHaveProperty('code', BAD_REQUEST);
      expect(error.response).toHaveProperty('fields', ['reschedule_reason_id']);
      expect(error.response).toHaveProperty('unknownIds', [9, 11]);
    }
  });

  test('# getCancelRescheduleReasons: null input', async () => {
    try {
      await service.getCancelRescheduleReasons(null, identity);
      fail("Shouldn't have made it here");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.response).toHaveProperty('message', "Codes can't be null or empty");
      expect(error.response).toHaveProperty('code', BAD_REQUEST);
    }
  });

  test('# getCancelRescheduleReasons: empty array input', async () => {
    try {
      await service.getCancelRescheduleReasons([], identity);
      fail("Shouldn't have made it here");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.response).toHaveProperty('message', "Codes can't be null or empty");
      expect(error.response).toHaveProperty('code', BAD_REQUEST);
    }
  });

  test('# getCancelRescheduleReasons: valid input', async () => {
    const codes = [
      CancelRescheduleReasonCode.CHANGE_DOCTOR,
      CancelRescheduleReasonCode.NO_SHOW_UP,
      CancelRescheduleReasonCode.ABORT_VISIT,
    ];
    const result = await service.getCancelRescheduleReasons(codes, identity);
    expect(result.length).toEqual(codes.length);
    const resultCodes = result.map((reason) => reason.code);
    codes.forEach((code) => {
      expect(resultCodes.includes(code)).toBeTruthy();
    });
  });

  test.each(Object.values(AppointmentStatusEnum))('# getAppointmentStatusById: valid input %p', async (code) => {
    const id = await service.getStatusIdByCode(identity, code);
    const status = await service.getAppointmentStatusById(id);
    expect(status.code).toEqual(code);
  });

  test('# getAppointmentStatusById: invalid input', async () => {
    const id = 1000;
    try {
      await service.getAppointmentStatusById(id);
      fail("Shouldn't have made it here");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response).toHaveProperty('message', `Appointment with status id=${id} doesn't exist`);
      expect(err.response).toHaveProperty('code', ErrorCodes.BAD_REQUEST);
    }
  });

  test.each(Object.values(AppointmentTypesEnum))('# getAppointmentTypeById: valid input %p', async (code) => {
    const id = await service.getTypeByCode(identity, code);
    const type = await service.getAppointmentTypeById(id);
    expect(type.code).toEqual(code.toString());
  });

  test('# getAppointmentTypeById: valid input %p', async () => {
    const id = 1000;
    try {
      await service.getAppointmentTypeById(id);
      fail("Shouldn't have made it here");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.response).toHaveProperty('message', `Can't find appointment type for id = ${id}`);
      expect(error.response).toHaveProperty('code', ErrorCodes.BAD_REQUEST);
    }
  });
});
