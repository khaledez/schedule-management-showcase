import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { AppointmentVisitModeEnum } from 'common/enums';
import { DateTime } from 'luxon';
import 'reflect-metadata';
import { AdhocAppointmentDto } from '../dto/appointment-adhoc.dto';

describe('appointments controller', () => {
  test('adhoc class validator fail', async () => {
    // Given ..
    const inputObj = {
      patientId: '10',
      modeCode: 'IN_PERSON',
      date: '2021-10-10T10:10:10Z',
    };

    // when
    const transformed: AdhocAppointmentDto = plainToClass(AdhocAppointmentDto, inputObj);

    const validationResult = await validate(transformed);

    expect(validationResult).toHaveLength(1);
    expect(validationResult[0]).toMatchObject({ property: 'modeCode' });
  });

  test('adhoc class validator succeed', async () => {
    // Given ..
    const inputObj = {
      patientId: '10',
      modeCode: 'IN-PERSON',
      date: '2021-10-10T10:10:10Z',
    };

    // when
    const transformed: AdhocAppointmentDto = plainToClass(AdhocAppointmentDto, inputObj);

    const validationResult = await validate(transformed);

    expect(validationResult).toHaveLength(0);
    expect(transformed.modeCode).toBe(AppointmentVisitModeEnum.IN_PERSON);
    expect(transformed.date).toStrictEqual(DateTime.fromISO('2021-10-10T10:10:10Z').toJSDate());
  });
});
