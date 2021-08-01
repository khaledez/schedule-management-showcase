import { getTimeGroup, TimeGroupCode } from 'common/enums/time-group';
import { TimeGroup } from 'common/interfaces/time-group-period';

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
});
