import { FilterDateInputDto, FilterIdsInputDto } from '@mon-medic/common';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { QueryTypes, Sequelize } from 'sequelize';
import { BAD_REQUEST, SEQUELIZE } from 'src/common/constants';
import { CalendarSearchInput, CalendarSearchResult } from './calendar.interface';

@Injectable()
export class CalendarService {
  constructor(@Inject(SEQUELIZE) private readonly sequelize: Sequelize) {}

  async search(query: CalendarSearchInput): Promise<CalendarSearchResult> {
    console.log(query);
    // table name
    let tableName = 'Availability';
    if (query.entryType === 'EVENT') {
      tableName = 'Events';
    } else if (query.entryType === 'APPOINTMENT') {
      tableName = 'Appointments';
    }

    // construct search query
    let queryStr = `SELECT * FROM ${tableName} WHERE deleted_by IS NULL `;
    const inputVals: unknown[] = [];

    // staffId
    const staffId = applyFilter(processIdFilter, 'staff_id', 'staffId', query.staffId);
    queryStr += staffId[0];
    inputVals.push(...staffId[1]);

    // dateRange
    const dateRange = applyFilter(processDateFilter, 'start_date', 'dateRange', query.dateRange);
    queryStr += dateRange[0];
    inputVals.push(...dateRange[1]);

    if (tableName === 'Availability' && query.availabilityFilter) {
      // TODO remove appointmentStatusId from the filter, it has no meaning in this context
      const availType = applyFilter(
        processIdFilter,
        'appointment_type_id',
        'appointmentTypeId',
        query.availabilityFilter.appointmentTypeId,
      );
      queryStr += availType[0];
      inputVals.push(...availType[1]);
    }

    // TODO figure out how to use timezoneId

    console.log(queryStr);
    const result = await this.sequelize.query(queryStr, {
      replacements: inputVals,
      mapToModel: true,
      type: QueryTypes.SELECT,
    });

    return { entries: [{ endDate: new Date(), startDate: new Date(), entryType: 'APPOINTMENT', staffId: 1 }] };
  }
}

type FilterProcesser<T> = (a: string, b: string, c: unknown) => [string, T[]];

function applyFilter<T>(func: FilterProcesser<T>, columnName, inputFieldName, filter): [string, T[]] {
  if (filter) {
    const processed = func(columnName, inputFieldName, filter);
    if (processed) {
      return [` AND ${processed[0]}`, processed[1] || []];
    }
  }
  return ['', []];
}

function processDateFilter(
  columnName: string,
  filterName: string,
  filter: FilterDateInputDto,
): [string, string[]] | undefined {
  // eq and between are only supported
  if (![filter.ne, filter.ge, filter.gt, filter.lt].every((el) => !el)) {
    throw new BadRequestException({
      fields: [filterName],
      message: 'unsupported filter operation, supported: between, eq',
      code: BAD_REQUEST,
    });
  }

  if (filter.between && filter.eq) {
    throw new BadRequestException({
      fields: [filterName],
      message: 'only one filter at a time is supported',
      code: BAD_REQUEST,
    });
  }

  if (filter.eq) {
    return [` DATE(${columnName}) = ? `, [DateTime.fromJSDate(filter.eq).toSQLDate()]];
  }

  if (filter.between) {
    return [
      ` (DATE(${columnName}) BETWEEN ? AND ?) `,
      [DateTime.fromJSDate(filter.between[0]).toSQLDate(), DateTime.fromJSDate(filter.between[1]).toSQLDate()],
    ];
  }

  return undefined;
}

function processIdFilter(
  columnName: string,
  filterName: string,
  filter: FilterIdsInputDto,
): [string, number[]] | undefined {
  // eq and in are only supported
  if (
    ![
      filter.ne,
      filter.ge,
      filter.gt,
      filter.lt,
      filter.beginsWith,
      filter.between,
      filter.contains,
      filter.or,
      filter.notContains,
      filter.notContains,
    ].every((el) => !el)
  ) {
    throw new BadRequestException({
      fields: [filterName],
      message: 'unsupported filter operation, supported: between, eq',
      code: BAD_REQUEST,
    });
  }
  if (filter.in && filter.eq) {
    throw new BadRequestException({
      fields: [filterName],
      message: 'only one filter at a time is supported',
      code: BAD_REQUEST,
    });
  }

  if (filter.eq) {
    return [` ${columnName} = ? `, [filter.eq]];
  }

  if (filter.in) {
    return [` ${columnName} IN (?) `, filter.in];
  }

  return undefined;
}
