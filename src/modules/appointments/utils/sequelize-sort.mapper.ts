import { InternalServerErrorException, Logger } from '@nestjs/common';
import { Order } from 'common/enums';
import { ErrorCodes } from 'common/enums/error-code.enum';
import { AppointmentsService, AssociationFieldsSortCriteria } from 'modules/appointments/appointments.service';
import { AppointmentSortDto, Key } from 'modules/appointments/dto/appointment-sort-dto';
import { QueryParamsDto } from 'modules/appointments/dto/query-params.dto';

// TODO: Need to rethink this. If multiple sort keys passed in query, it will sort using the first one
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
      [AppointmentsService.DATE_COLUMN, 'DESC'],
      ['id', 'DESC'],
    ];
    // reverse sort
    if (shouldReverseSort) {
      defaultOrder = [
        [AppointmentsService.DATE_COLUMN, 'ASC'],
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
        order = [[column, reverseSort(sort.order, shouldReverseSort)]];
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

// TODO: Functionality here is a simplified version of the function @see {sequelizeSortMapper}.
//  Rethink the entire file.
// eslint-disable-next-line complexity
export function getQueryGenericSortMapper(
  sortDtos: AppointmentSortDto[],
  associationFields: AssociationFieldsSortCriteria,
) {
  let sortKeys: AppointmentSortDto[] = [
    { key: Key.DATE, order: Order.DESC },
    { key: Key.ID, order: Order.DESC },
  ];
  if (Array.isArray(sortDtos) && sortDtos.length !== 0) {
    sortKeys = sortDtos;
  }
  try {
    const order = [];
    for (const sortKey of sortKeys) {
      let orderOption = [sortKey.key, sortKey.order];
      if (associationFields[sortKey.key]) {
        const { relation, column } = associationFields[sortKey.key];
        if (relation) {
          orderOption = [relation, column, sortKey.order];
        } else {
          orderOption = [column, sortKey.order];
        }
      }
      order.push(orderOption);
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
