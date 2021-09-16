import { Op } from 'sequelize';

export function getDateWhereClauseTestCases() {
  const dateA = new Date('2021-10-24T00:00:00.000Z');
  const dateB = new Date('2021-10-25T00:00:00.000Z');
  return [
    { filter: { eq: dateA }, expected: { [Op.between]: [dateA, new Date('2021-10-24T23:59:59.999Z')] } },
    { filter: { between: [dateA, dateB] }, expected: { [Op.between]: [dateA, new Date('2021-10-25T23:59:59.999Z')] } },
    { filter: {}, expected: { [Op.notIn]: [] } },
  ];
}

export function getEntityIdWhereClauseTestCases() {
  return [
    { filter: { eq: 1, or: null }, expected: { [Op.eq]: 1 } },
    { filter: { in: [1, 2, 3, 4, 5], or: null }, expected: { [Op.in]: [1, 2, 3, 4, 5] } },
    { filter: { or: null }, expected: { [Op.notIn]: [] } },
  ];
}
