import { Op, Order } from 'sequelize';
import { ErrorCodes } from 'src/common/enums/error-code.enum';
import { InternalServerErrorException, Logger } from '@nestjs/common';

// eslint-disable-next-line complexity
export function sequelizeSortMapper(logger: Logger, query, associationFields) {
  try {
    let sort = query && query.sort;
    const defaultOrder = [['date', 'DESC']];
    logger.debug({
      function: 'sequelizeSortMapper before parse',
      sort,
      associationFields,
      condition: !sort || !sort.length,
    });
    if (!sort || !sort.length) {
      return defaultOrder;
    }
    sort = JSON.parse(sort);
    logger.debug({
      function: 'sequelizeSortMapper sortJSON',
      sortJSON: sort,
    });
    let order = [];
    const associationFieldsKeys = Object.keys(associationFields).map((e) => e);
    if (associationFieldsKeys.includes(sort.key)) {
      const { relation, column } = associationFields[sort.key];
      order = [[relation, column, sort.order]];
    } else {
      order = [[sort.key, sort.order]];
    }
    return order;
  } catch (error) {
    throw new InternalServerErrorException({
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: 'Failed to create sort mapper',
      error,
    });
  }
}
