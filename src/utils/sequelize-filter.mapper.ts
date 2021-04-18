import { Op } from 'sequelize';
import { ErrorCodes } from 'src/common/enums/error-code.enum';
import { InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { QueryParamsDto } from '../common/dtos/query-params.dto';

const arrayToObject = (arr) => Object.assign({}, ...arr.map((item) => ({ ...item })));

// eslint-disable-next-line complexity
export function sequelizeFilterMapper(logger: Logger, query: QueryParamsDto, associationFieldsNames, customFilters) {
  try {
    let filters = query && query.filter;
    const where = {};
    logger.debug({
      function: 'sequelizeFilterMapper START',
      where,
      query,
      filters,
      associationFieldsNames,
      condition: !filters,
    });
    if (!filters) {
      return where;
    }
    if (Object.keys(customFilters).length) {
      const { filter, name } = customFilters;
      logger.debug({
        function: 'sequelizeFilterMapper Object.keys(customFilters)',
        filters,
        customFilters,
      });
      delete filters[name];
      filters = Object.assign(where, filter);
    }

    // filters = JSON.parse(filters);
    logger.debug({
      function: 'sequelizeFilterMapper',
      filtersJSON: filters,
    });
    const associationFieldsKeys = Object.keys(associationFieldsNames);
    logger.debug({
      function: 'sequelizeFilterMapper',
      associationFieldsKeys,
    });
    Object.keys(filters).forEach((filterName) => {
      let filterNameVariable = filterName;
      const operators = filters[filterNameVariable];
      if (associationFieldsKeys.includes(filterNameVariable)) {
        filterNameVariable = associationFieldsNames[filterNameVariable];
      }
      const filter = Object.keys(operators).map((key) => {
        return mapToSequelizeFilter(key, operators);
      });
      where[filterNameVariable] = arrayToObject(filter);
      logger.debug({
        function: 'sequelizeFilterMapper',
        filterNameVariable,
        operators,
        where,
      });
    });
    return where;
  } catch (error) {
    throw new InternalServerErrorException({
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: 'Failed to create filter mapper',
      error,
    });
  }
}

// eslint-disable-next-line complexity
function mapToSequelizeFilter(key, filter) {
  switch (key) {
    case 'eq':
      return { [Op.eq]: filter[key] };
    case 'ne':
      return { [Op.ne]: filter[key] };
    case 'le':
      return { [Op.lte]: filter[key] };
    case 'lt':
      return { [Op.lt]: filter[key] };
    case 'ge':
      return { [Op.gte]: filter[key] };
    case 'gt':
      return { [Op.gt]: filter[key] };
    case 'in':
      return { [Op.in]: filter[key] };
    case 'nin':
      return { [Op.notIn]: filter[key] };
    case 'like':
      return { [Op.like]: filter[key] };
    case 'beginsWith':
      return { [Op.startsWith]: filter[key] };
    case 'contains':
      return { [Op.substring]: filter[key] };
    // TODO: MMX-S3 reverse contains.
    case 'notContains':
      return { [Op.not]: new RegExp(filter[key]) };
    case 'between':
      return { [Op.between]: [filter[key][0], filter[key][1]] };
    case 'and':
      return { [Op.and]: filter[key] };
    case 'or':
      return { [Op.or]: filter[key] };
    default:
      throw new BadRequestException('Invalid filter key!');
  }
}
