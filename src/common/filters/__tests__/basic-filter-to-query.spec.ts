import { isStartOfDay, processFilterDatesInput } from '../basic-filter-to-query';
import { Op } from 'sequelize';
import { BadRequestException } from '@nestjs/common';
import { ErrorCodes } from '../../enums';

describe('# basic-filter-to-query', () => {
  test.each([
    { date: '2021-10-25T07:13:40.084Z', expected: false },
    { date: '2021-10-25', expected: true },
  ])('# isStartOfDay', (testCase) => {
    expect(isStartOfDay(new Date(testCase.date))).toEqual(testCase.expected);
  });

  test.each([
    {
      filter: {
        between: [new Date('2021-10-25'), new Date('2021-10-26')],
      },
      expected: { start: '2021-10-25', end: '2021-10-26T23:59:59.999Z' },
    },
    {
      filter: {
        between: [new Date('2021-10-24T13:44:59.999Z'), new Date('2021-10-29T00:59:59.999Z')],
      },
      expected: { start: '2021-10-24T13:44:59.999Z', end: '2021-10-29T00:59:59.999Z' },
    },
  ])('# processFilterDatesInput: valid input', (testCase) => {
    const result = processFilterDatesInput('testCol', 'filterTest', testCase.filter);
    expect(result).toEqual({
      testCol: {
        [Op.between]: [new Date(testCase.expected.start), new Date(testCase.expected.end)],
      },
    });
  });

  test.each([
    { filter: { ne: new Date('2021-10-26') } },
    { filter: { ge: new Date('2021-10-26') } },
    { filter: { gt: new Date('2021-10-26') } },
    { filter: { lt: new Date('2021-10-26') } },
  ])('# processFilterDatesInput: Invalid operations', (testCase) => {
    try {
      processFilterDatesInput('testCol', 'filterTest', testCase.filter);
      fail("Shouldn't have made it here");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response).toHaveProperty('code', ErrorCodes.BAD_REQUEST);
      expect(err.response).toHaveProperty('message', 'unsupported filter operation, supported: between, eq');
      expect(err.response).toHaveProperty('fields', ['filterTest']);
    }
  });

  test("# processFilterDatesInput: Invalid use, eq and between can't be used at the same time", () => {
    const filter = {
      between: [new Date('2021-10-25'), new Date('2021-10-26')],
      eq: new Date('2021-10-26'),
    };
    try {
      processFilterDatesInput('testCol', 'filterTest', filter);
      fail("Shouldn't have made it here");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response).toHaveProperty('code', ErrorCodes.BAD_REQUEST);
      expect(err.response).toHaveProperty('message', 'only one filter at a time is supported');
      expect(err.response).toHaveProperty('fields', ['filterTest']);
    }
  });
});
