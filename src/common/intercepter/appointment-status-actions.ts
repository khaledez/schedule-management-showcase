import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Reflector } from '@nestjs/core';
@Injectable()
export class AppointmentStatusActions implements NestInterceptor {
  constructor(private eventEmitter: EventEmitter2, private reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((res) => {
        if (res?.edges && Array.isArray(res.edges)) {
          const edges = res.edges.map((edge) => {
            if (edge.node?.primaryAction?.nameEn) {
              edge.node.primaryAction.nameEn = statusToActionName(edge.node.primaryAction.nameEn);
            }
            return {
              cursor: edge.cursor,
              node: edge.node,
            };
          });
          return {
            ...res,
            edges: edges,
          };
        } else if (res?.primaryAction) {
          res.primaryAction.nameEn = statusToActionName(res.primaryAction.nameEn);
        }
        return res;
      }),
    );
  }
}

// eslint-disable-next-line complexity
function statusToActionName(name) {
  switch (name.toLowerCase()) {
    case 'status':
      return 'Action';
    case 'wait list':
      return 'Schedule';
    case 'scheduled':
      return 'Confirm (1)';
    case 'first confirmation':
      return 'Confirm (2)';
    case 'final confirmation':
      return 'Check-in';
    case 'checked in':
      return 'Ready';
    default:
      return name;
  }
}
