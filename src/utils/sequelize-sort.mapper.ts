import { Op, Order } from 'sequelize';
import { ErrorCodes } from 'src/common/enums/error-code.enum';
import { InternalServerErrorException, Logger } from '@nestjs/common';

// eslint-disable-next-line complexity
export function sequelizeSortMapper(logger: Logger, query, associationFields) {
  try {
    let sort = query && query.sort;
    // to get the last elements i need to reverse sort and git the limit
    const shouldReverseSort: boolean = query && !!query.last;
    let defaultOrder = [['date', 'DESC']];
    // reverse sort
    if (shouldReverseSort) {
      defaultOrder = [['date', 'ASC']];
    }
    logger.debug({
      function: 'sequelizeSortMapper before parse',
      sort,
      associationFields,
      condition: !sort || !sort.length,
    });
    if (!sort || !sort.length) {
      return defaultOrder;
    }
    sort = sort[0];
    logger.debug({
      function: 'sequelizeSortMapper sortJSON',
      sortJSON: sort,
    });
    let order = [];
    const associationFieldsKeys = Object.keys(associationFields).map((e) => e);
    if (associationFieldsKeys.includes(sort.key)) {
      const { relation, column } = associationFields[sort.key];
      order = [[relation, column, reverseSort(sort.order, shouldReverseSort)]];
    } else {
      order = [[sort.key, reverseSort(sort.order, shouldReverseSort)]];
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

// reverse sort order.
const reverseSort = (sort: string, reverse: boolean) => {
  let defaultSort = sort;
  if (reverse) {
    defaultSort = defaultSort === 'ASC' ? 'DESC' : 'ASC';
  }
  return defaultSort;
};
