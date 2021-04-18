import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const PagingInfo = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.pagingInfo;
});
