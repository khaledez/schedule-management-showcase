import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { getNamespace, middleware, setSegment } from 'aws-xray-sdk-core';
import { Observable } from 'rxjs';

@Injectable()
export class XRayInterceptor implements NestInterceptor {
  constructor(private readonly serviceName) {
    middleware.setDefaultName(this.serviceName);
  }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    const segment = middleware.traceRequestResponseCycle(req, res);

    const ns = getNamespace();
    ns.bindEmitter(req);
    ns.bindEmitter(res);

    ns.run(() => {
      setSegment(segment);
    });

    const handled = next.handle();
    // handled.subscribe({
    //   error(err) {
    //     segment.addError(err);
    //   },
    // });

    return handled;
  }
}
