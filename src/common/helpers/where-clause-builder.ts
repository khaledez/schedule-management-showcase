import { FilterDateInputDto } from '@monmedx/monmedx-common';
import { FilterIdsInputDto } from '@monmedx/monmedx-common/src/dto/filter-ids-input.dto';
import sequelize, { Op } from 'sequelize';

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

  public static getDateWhereClause(dateRange: FilterDateInputDto, defaultClause = { [Op.notIn]: [] }) {
    if (!dateRange) {
      return defaultClause;
    }
    // Set endTime to 23:59:59 due to sequelize limitations
    if (dateRange.between) {
      dateRange.between[1].setUTCHours(23, 59, 59, 999);
      return { [Op.between]: dateRange.between };
    } else if (dateRange.eq) {
      const end = new Date(dateRange.eq.getTime());
      end.setUTCHours(23, 59, 59, 999);
      return { [Op.between]: [dateRange.eq, end] };
    }

    return defaultClause;
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
}
