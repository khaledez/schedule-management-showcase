import { InternalServerErrorException, Logger } from '@nestjs/common';
import { QueryParamsDto } from 'common/dtos';
import { AssociationFieldsSortCriteria } from 'modules/appointments/appointments.service';
import { ErrorCodes } from '../common/enums/error-code.enum';

// eslint-disable-next-line complexity
export function sequelizeSortMapper(
  logger: Logger,
  query: QueryParamsDto,
  associationFields: AssociationFieldsSortCriteria,
  shouldReverseSort: boolean,
) {
  try {
    const sort = query && query.sort && query.sort[0];
    // to get the last elements i need to reverse sort and git the limit
    let defaultOrder = [
      ['date', 'DESC'],
      ['availability', 'start_time', 'DESC'],
      ['id', 'DESC'],
    ];
    // reverse sort
    if (shouldReverseSort) {
      defaultOrder = [
        ['date', 'ASC'],
        ['availability', 'start_time', 'ASC'],
        ['id', 'ASC'],
      ];
    }
    logger.debug({
      function: 'sequelizeSortMapper before parse',
      sort,
      associationFields,
      condition: !sort,
    });
    if (!sort) {
      return defaultOrder;
    }
    logger.debug({
      function: 'sequelizeSortMapper sortJSON',
      sortJSON: sort,
    });
    let order = [];
    if (associationFields[sort.key]) {
      const { relation, column } = associationFields[sort.key];
      if (relation) {
        order = [[relation, column, reverseSort(sort.order, shouldReverseSort)]];
      } else {
        order = [[sort.key, reverseSort(sort.order, shouldReverseSort)]];
      }
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
