import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { SEQUELIZE } from '../constants';
import { Observable } from 'rxjs';
import { Sequelize } from 'sequelize-typescript';
import { map } from 'rxjs/operators';
import { ErrorCodes } from '../enums/error-code.enum';
import { ConfigService } from '@nestjs/config';
import { PaginationConfig } from '../interfaces/pagination-config.interface';
import { BaseModel } from '../models/base-model';

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  private readonly logger = new Logger('PaginationInterceptor');
  constructor(@Inject(SEQUELIZE) private readonly sequelize: Sequelize, private configService: ConfigService) {}
  // eslint-disable-next-line complexity
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { first: _first, last: _last, before: _before, after: _after } = request.body;
    // convert it to number here because the request comes here before dto.
    let first = +_first;
    let last = +_last;
    let before = +_before;
    const after = +_after;
    if (
      (!!first && !!last) ||
      (!!before && !!after) ||
      first < 0 ||
      last < 0 ||
      before < 1 ||
      last > before ||
      (first && !Number.isInteger(first)) ||
      (last && !Number.isInteger(last)) ||
      (before && !Number.isInteger(before)) ||
      (after && !Number.isInteger(after))
    ) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_INPUT,
        message: 'Invalid Query filters!',
      });
    }
    if ((!!first && !!before) || (!!last && !!after)) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_INPUT,
        message: 'Unsupported pagination way!',
      });
    }
    try {
      const { max, default: defaultLimit } = this.configService.get<PaginationConfig>('paginationInfo');
      const limit = (first || last || defaultLimit) as number;

      const finalLimit = max <= limit ? max : limit;
      let offset: number;
      if (first && after) {
        offset = after;
      } else if (last && before) {
        first = before;
        offset = before - last;
        last = null;
        before = null;
      } else {
        offset = 0;
      }
      request.pagingInfo = {
        limit: finalLimit,
        offset: offset < 0 ? 0 : offset,
        reverseSort: !!last,
      };
      this.logger.debug(`request.pagingInfo ${JSON.stringify(request.pagingInfo)}`);

      return next.handle().pipe(
        // eslint-disable-next-line complexity
        map((res) => {
          const { data, hasPreviousPage = false, count: total } = res;
          const modifiedDataAsEdges = data.map((node: any, index) => ({
            // start cursor from 1
            cursor: (!last ? offset + index : total + offset - index) + 1,
            // cursor: (!last ? offset + index : !!last && !!before ? before - last : total + offset - index) + 1,
            node,
          })) as [{ node: BaseModel; cursor: number }];
          this.logger.debug({
            function: 'PaginationInterceptor modifiedDataAsEdges',
            modifiedDataAsEdges,
          });
          // get the page info
          const hasNextPage = total > finalLimit + offset;
          const startCursor = modifiedDataAsEdges.length ? modifiedDataAsEdges[0].cursor : null;
          const endCursor = modifiedDataAsEdges.length
            ? modifiedDataAsEdges[modifiedDataAsEdges.length - 1].cursor
            : null;
          this.logger.log({
            arrayTotalLength: modifiedDataAsEdges.length,
            total,
            pagingInfo: request.pagingInfo,
          });
          return {
            edges: modifiedDataAsEdges,
            pageInfo: {
              hasNextPage: !last ? hasNextPage : false,
              hasPreviousPage: !first && last ? hasPreviousPage : false,
              startCursor,
              endCursor,
            },
          };
        }),
      );
    } catch (error) {
      this.logger.error({
        function: 'PaginationInterceptor',
        error,
      });
      throw new InternalServerErrorException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }
}
