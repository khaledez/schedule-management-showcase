import { getQueryGenericSortMapper } from 'modules/appointments/utils/sequelize-sort.mapper';
import { getQueryGenericSortMapperTestCases } from 'modules/appointments/__tests__/appointment.data';

describe('Appointment sequelize-sort mapper functionalities', () => {
  test.each(getQueryGenericSortMapperTestCases())('# getQueryGenericSortMapper: %p', (testCase) => {
    expect(testCase.expectedOrder).toEqual(getQueryGenericSortMapper(testCase.sortDtos, testCase.associationFields));
  });
});
