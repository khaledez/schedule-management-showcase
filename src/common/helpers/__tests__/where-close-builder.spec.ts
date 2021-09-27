import { WhereClauseBuilder } from '../where-clause-builder';
import { getDateWhereClauseTestCases, getEntityIdWhereClauseTestCases } from './helpers.data';
import { Op } from 'sequelize';
import { BadRequestException } from '@nestjs/common';
import { ErrorCodes } from '../../enums';

describe('WhereClauseBuilder', () => {
  test.each(getEntityIdWhereClauseTestCases())('# getEntityIdWhereClause', (testCase) => {
    expect(testCase.expected).toEqual(WhereClauseBuilder.getEntityIdWhereClause(testCase.filter));
  });

  test.each(getDateWhereClauseTestCases())('# getDateWhereClause: valid input', (testCase) => {
    const result = WhereClauseBuilder.getDateWhereClause('testCol', 'filterTest', testCase.filter);
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
      WhereClauseBuilder.getDateWhereClause('testCol', 'filterTest', testCase.filter);
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
      WhereClauseBuilder.getDateWhereClause('testCol', 'filterTest', filter);
      fail("Shouldn't have made it here");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response).toHaveProperty('code', ErrorCodes.BAD_REQUEST);
      expect(err.response).toHaveProperty('message', 'only one filter at a time is supported');
      expect(err.response).toHaveProperty('fields', ['filterTest']);
    }
  });

  test.each([
    {
      filter: {
        between: [new Date('2021-10-25'), new Date('2021-10-26')],
      },
    },
    {
      filter: {
        between: [new Date('2021-10-24T13:44:59.999Z'), new Date('2021-10-29T00:59:59.999Z')],
      },
    },
  ])('# getDateTimeWhereClause: valid input', (testCase) => {
    const result = WhereClauseBuilder.getDateTimeWhereClause('testCol', 'filterTest', testCase.filter);
    expect(result).toEqual({
      testCol: {
        [Op.between]: [new Date(testCase.filter.between[0]), new Date(new Date(testCase.filter.between[1]))],
      },
    });
  });

  test.each([
    { filter: { ne: new Date('2021-10-26') } },
    { filter: { ge: new Date('2021-10-26') } },
    { filter: { gt: new Date('2021-10-26') } },
    { filter: { lt: new Date('2021-10-26') } },
    { filter: { eq: new Date('2021-10-26') } },
  ])('# getDateTimeWhereClause: Invalid operations', (testCase) => {
    try {
      WhereClauseBuilder.getDateTimeWhereClause('testCol', 'filterTest', testCase.filter);
      fail("Shouldn't have made it here");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.response).toHaveProperty('code', ErrorCodes.BAD_REQUEST);
      expect(err.response).toHaveProperty('message', 'unsupported filter operation, supported: between');
      expect(err.response).toHaveProperty('fields', ['filterTest']);
    }
  });
});
