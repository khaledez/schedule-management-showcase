import {
  extractDayTimeInSeconds,
  getTimeGroup,
  isInTimeGroup,
  TimeGroupCode,
  transformDayTimeToSeconds,
} from 'common/enums/time-group';
import { TimeGroup } from 'common/interfaces/time-group-period';
import {
  getExtractDayTimeInSecondsTestCases,
  getIsInTimeGroupTestCases,
  getTransformDayTimeToSecondsTestCases,
} from 'common/enums/__tests__/enum-utils.data';

describe('# TimeGroup functionality test', () => {
  test('# Test getTimeGroup for valid input using values', () => {
    const timeGroupCodes: TimeGroupCode[] = Object.values(TimeGroupCode);
    timeGroupCodes.forEach((code) => {
      const timeGroup: TimeGroup = getTimeGroup(code);
      expect(timeGroup).toBeDefined();
      expect(timeGroup.start).toBeDefined();
      expect(timeGroup.end).toBeDefined();
    });
  });

  test('# Test getTimeGroup for valid input using keys', () => {
    const timeGroupCodes: string[] = Object.keys(TimeGroupCode);
    timeGroupCodes.forEach((code) => {
      const timeGroup: TimeGroup = getTimeGroup(code);
      expect(timeGroup).toBeDefined();
      expect(timeGroup.start).toBeDefined();
      expect(timeGroup.end).toBeDefined();
    });
  });

  test('# Test getTimeGroup for invalid input', () => {
    const timeGroupCodes: string[] = ['random1', 'random2'];
    timeGroupCodes.forEach((code) => {
      const timeGroup: TimeGroup = getTimeGroup(code);
      expect(timeGroup).toBeNull();
    });
  });

  test.each(getTransformDayTimeToSecondsTestCases())('# transformDayTimeToSeconds', (testCase) => {
    expect(transformDayTimeToSeconds(testCase.dayTime)).toEqual(testCase.expected);
  });

  test.each(getExtractDayTimeInSecondsTestCases())('# extractDayTimeInSeconds', (testCase) => {
    expect(extractDayTimeInSeconds(new Date(testCase.date))).toEqual(testCase.expected);
  });

  test.each(getIsInTimeGroupTestCases())('# isInTimeGroup: %p', (testCase) => {
    expect(testCase.isInGroup).toEqual(isInTimeGroup(testCase.date, testCase.timeGroup));
  });
});
