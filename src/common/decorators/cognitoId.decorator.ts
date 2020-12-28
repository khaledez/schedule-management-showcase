import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CognitoId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers.payload.sub;
  },
);
