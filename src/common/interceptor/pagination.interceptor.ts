import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
  InternalServerErrorException,
} from '@nestjs/common';
import { SEQUELIZE } from '../constants';
import { Observable } from 'rxjs';
import { Sequelize } from 'sequelize-typescript';
import { Reflector } from '@nestjs/core';
import { map } from 'rxjs/operators';
import { Op } from 'sequelize';

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  private readonly logger = new Logger('PaginationInterceptor');
  constructor(
    @Inject(SEQUELIZE) private readonly sequalize: Sequelize,
    private reflector: Reflector,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      // eslint-disable-next-line complexity
      map((res) => {
        const { data, limit, hasPreviousPage = false } = res;
        // get the incoming model
        const model = this.reflector.get<string>('modle', context.getHandler());
        this.logger.debug(`incomming model is ${model}`);
        if (!model) {
          this.logger.error('modle not set in the meta data');
          throw new InternalServerErrorException({
            code: 'SERVER_ERROR',
            message: 'Internal Server Error',
          });
        }
        // check if the modle already exists
        if (!this.sequalize.models[model]) {
          this.logger.error(`modle: ${model} not set in the system`);
          throw new InternalServerErrorException({
            code: 'SERVER_ERROR',
            message: 'Internal Server Error',
          });
        }
        // get the page info
        const dataLength = data.length;
        const hasNextPage = dataLength > limit;
        const startCursor = dataLength ? data[0].id : null;
        const endCursor = dataLength ? data[dataLength - 1].id : null;

        return {
          edges: data.map((node: any) => ({
            node,
          })),
          pageInfo: {
            hasNextPage,
            hasPreviousPage,
            startCursor,
            endCursor,
          },
        };
      }),
    );
  }
}
