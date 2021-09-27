import { FilterDateInputDto, FilterIdsInputDto } from '@monmedx/monmedx-common';
import { Op, WhereAttributeHash } from 'sequelize';
import { BadRequestException } from '@nestjs/common';
import { BAD_REQUEST, DAY_TO_MILLI_SECOND } from 'common/constants';
import { DateTime } from 'luxon';
import { ErrorCodes } from '../enums';

export function processFilterIdsInput(
  columnName: string,
  filterName: string,
  filter: FilterIdsInputDto,
): { [key: string]: WhereAttributeHash } {
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
      message: 'unsupported filter operation, supported: in, eq',
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
    return { [columnName]: { [Op.eq]: filter.eq } };
  }

  if (filter.in) {
    return { [columnName]: { [Op.in]: filter.in } };
  }

  return {};
}

// eslint-disable-next-line complexity
export function processFilterDatesInput(
  columnName: string,
  filterName: string,
  filter: FilterDateInputDto,
): { [key: string]: WhereAttributeHash } {
  // eq and between are only supported
  if (![filter.ne, filter.ge, filter.gt, filter.lt].every((el) => !el)) {
    throw new BadRequestException({
      fields: [filterName],
      message: 'unsupported filter operation, supported: between, eq',
      code: ErrorCodes.BAD_REQUEST,
    });
  }

  if (filter.between && filter.eq) {
    throw new BadRequestException({
      fields: [filterName],
      message: 'only one filter at a time is supported',
      code: ErrorCodes.BAD_REQUEST,
    });
  }

  if (filter.eq) {
    const startOfDay = DateTime.fromJSDate(filter.eq).toSQLDate();
    const endOfDay = `${startOfDay} 23:59:59`;
    return { [columnName]: { [Op.between]: [startOfDay, endOfDay] } };
  }

  if (filter.between) {
    if (isStartOfDay(filter.between[0]) && isStartOfDay(filter.between[1])) {
      const startOfDate1 = new Date(filter.between[0]);
      const endOfDate2 = new Date(filter.between[1].getTime() + DAY_TO_MILLI_SECOND - 1);
      return {
        [columnName]: {
          [Op.between]: [startOfDate1, endOfDate2],
        },
      };
    }
    return {
      [columnName]: {
        [Op.between]: [filter.between[0], filter.between[1]],
      },
    };
  }

  return {};
}

export function isStartOfDay(date: Date): boolean {
  return date.toISOString().endsWith('00:00:00.000Z');
}
