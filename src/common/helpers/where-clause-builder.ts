import { FilterDateInputDto } from '@monmedx/monmedx-common';
import { FilterIdsInputDto } from '@monmedx/monmedx-common/src/dto/filter-ids-input.dto';
import sequelize, { Op, WhereAttributeHash } from 'sequelize';
import { BadRequestException } from '@nestjs/common';
import { ErrorCodes } from '../enums';
import { DateTime } from 'luxon';

export class WhereClauseBuilder {
  public static getEntityIdWhereClause(entity: FilterIdsInputDto, defaultValue = { [Op.notIn]: [] }) {
    if (!entity) {
      return defaultValue;
    }

    if (entity.in) {
      return { [Op.in]: entity.in };
    } else if (entity.eq) {
      return { [Op.eq]: entity.eq };
    }

    return defaultValue;
  }

  public static getTimeWhereClause(
    modelName: string,
    colName: string,
    timeRange: string[],
    defaultClause = { [Op.or]: [null] },
  ) {
    if (!timeRange || timeRange.length !== 2 || !timeRange[0] || !timeRange[1]) {
      return defaultClause;
    }
    const colPath = `\`${modelName}\`.\`${colName}\``;
    return sequelize.literal(`TIME(${colPath}) >= '${timeRange[0]}' AND TIME(${colPath}) <= '${timeRange[1]}'`);
  }

  public static getDateWhereClause(
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
      filter.between[0].setUTCHours(0, 0, 0, 0);
      filter.between[1].setUTCHours(23, 59, 59, 999);
      return {
        [columnName]: {
          [Op.between]: [filter.between[0], filter.between[1]],
        },
      };
    }

    return {};
  }

  public static getDateTimeWhereClause(
    columnName: string,
    filterName: string,
    filter: FilterDateInputDto,
  ): { [key: string]: WhereAttributeHash } {
    // eq and between are only supported
    if (![filter.ne, filter.ge, filter.gt, filter.lt, filter.eq].every((el) => !el)) {
      throw new BadRequestException({
        fields: [filterName],
        message: 'unsupported filter operation, supported: between',
        code: ErrorCodes.BAD_REQUEST,
      });
    }

    if (filter.between) {
      return {
        [columnName]: {
          [Op.between]: [filter.between[0], filter.between[1]],
        },
      };
    }

    return {};
  }
}
