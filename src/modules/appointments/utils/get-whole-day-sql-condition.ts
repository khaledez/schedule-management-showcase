import { DateTime } from 'luxon';

/**
 * @param date Returns today if not provided
 * @returns Array containing SQL between dates inclusive of whole day
 */
const getInclusiveSQLDateCondition = (date1?: DateTime, date2?: DateTime) => {
  const d1 = date1 ? date1 : DateTime.now();
  // Get inclusive span
  let startOfDay = d1.startOf('day');
  let endOfDay = date2 ? date2.endOf('day') : d1.endOf('day');
  // Convert to server timezone
  startOfDay = startOfDay.toUTC();
  endOfDay = endOfDay.toUTC();
  // Return converted to sql fromat
  return [startOfDay.toSQL({ includeOffset: false }), endOfDay.toSQL({ includeOffset: false })];
};

export default getInclusiveSQLDateCondition;
