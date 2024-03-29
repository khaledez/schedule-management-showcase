import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Injectable()
export class AppointmentStatusActions implements NestInterceptor {
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
    case 'wait list':
      return 'Wait List';
    case 'scheduled':
      return 'Schedule';
    case 'first confirmation':
      return 'Confirm (1)';
    case 'final confirmation':
      return 'Confirm (2)';
    case 'checked in':
      return 'Check-in';
    case 'canceled':
      return 'Cancel';
    default:
      return name;
  }
}
