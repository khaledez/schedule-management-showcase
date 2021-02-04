import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * this decorator get the cognito arugments from the header and add it on the memory to use.
 */
export const CognitoIdentity = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const cognitoIdentity = {
      cognitoId: request.headers['x-cognito-cognito-id'],
      clinicId: +request.headers['x-mmx-clinic-id'],
      userLang: request.headers['x-mmx-lang'],
      userId: +request.headers['x-cognito-user-id'],
    };
    if (
      !cognitoIdentity['cognitoId'] ||
      !cognitoIdentity['clinicId'] ||
      !cognitoIdentity['userLang'] ||
      !cognitoIdentity['userId']
    )
      throw new UnauthorizedException(
        'cognitoIdentity object is missing one or more arguments',
      );
    return cognitoIdentity;
  },
);
