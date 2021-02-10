import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * this decorator get the cognito arguments from the header and add it on the memory to use.
 */
export const Identity = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const cognitoIdentity = {
      cognitoId: request.headers['x-mmx-cognito-id'],
      clinicId: +request.headers['x-mmx-clinic-id'],
      // userLang: request.headers['x-mmx-lang'],
      userId: +request.headers['x-mmx-user-id'],
    };
    console.log('cognitoIdentity', cognitoIdentity);
    if (
      !cognitoIdentity.cognitoId ||
      !cognitoIdentity.clinicId ||
      // !cognitoIdentity.userLang ||
      !cognitoIdentity.userId
    ) {
      throw new ForbiddenException({
        code: 'UNAUTHORIZED_ACCESS',
        message: 'cognitoIdentity object is missing one or more arguments',
      });
    }
    return cognitoIdentity;
  },
);
