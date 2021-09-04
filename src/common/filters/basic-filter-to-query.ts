import { FilterDateInputDto, FilterIdsInputDto } from '@monmedx/monmedx-common';
import { Op, WhereAttributeHash } from 'sequelize';
import { BadRequestException } from '@nestjs/common';
import { BAD_REQUEST } from 'common/constants';
import { DateTime } from 'luxon';

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
    const startOfDay = DateTime.fromJSDate(filter.eq).toSQLDate();
    const endOfDay = `${startOfDay} 23:59:59`;
    return { [columnName]: { [Op.between]: [startOfDay, endOfDay] } };
  }

  if (filter.between) {
    const startOfDate1 = DateTime.fromJSDate(filter.between[0]).toSQLDate();
    const endOfDate2 = `${DateTime.fromJSDate(filter.between[1]).toSQLDate()} 23:59:59`; //Append end of day time
    return {
      [columnName]: {
        [Op.between]: [startOfDate1, endOfDate2],
      },
    };
  }

  return {};
}
