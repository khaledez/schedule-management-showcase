import { WhereClauseBuilder } from '../where-clause-builder';
import { getDateWhereClauseTestCases, getEntityIdWhereClauseTestCases } from './helpers.data';

describe('WhereClauseBuilder', () => {
  test.each(getDateWhereClauseTestCases())('# getDateWhereClause', (testCase) => {
    expect(testCase.expected).toEqual(WhereClauseBuilder.getDateWhereClause(testCase.filter));
  });

  test.each(getEntityIdWhereClauseTestCases())('# getEntityIdWhereClause', (testCase) => {
    expect(testCase.expected).toEqual(WhereClauseBuilder.getEntityIdWhereClause(testCase.filter));
  });
});
