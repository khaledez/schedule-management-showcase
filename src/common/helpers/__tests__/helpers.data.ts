import { Op } from 'sequelize';

export function getDateWhereClauseTestCases() {
  return [
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
      expected: { start: '2021-10-24', end: '2021-10-29T23:59:59.999Z' },
    },
  ];
}

export function getEntityIdWhereClauseTestCases() {
  return [
    { filter: { eq: 1, or: null }, expected: { [Op.eq]: 1 } },
    { filter: { in: [1, 2, 3, 4, 5], or: null }, expected: { [Op.in]: [1, 2, 3, 4, 5] } },
    { filter: { or: null }, expected: { [Op.notIn]: [] } },
  ];
}
