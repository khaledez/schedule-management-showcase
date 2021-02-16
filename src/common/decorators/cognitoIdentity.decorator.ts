import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ErrorCodes } from '../enums/error-code.enum';

/**
 * this decorator get the cognito arguments from the header and add it on the memory to use.
 */
export const Identity = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const cognitoIdentity = {
      cognitoId: request.headers.sub,
      clinicId: +request.headers['custom:x-mmx-clinic-id'],
      userId: +request.headers['custom:x-mmx-user-id'],
    };
    console.log('cognitoIdentity', cognitoIdentity);
    if (
      !cognitoIdentity.cognitoId ||
      !cognitoIdentity.clinicId ||
      // !cognitoIdentity.userLang ||
      !cognitoIdentity.userId
    ) {
      throw new ForbiddenException({
        code: ErrorCodes.UNAUTHORIZED_ACCESS,
        message: 'cognitoIdentity object is missing one or more arguments',
      });
    }
    return cognitoIdentity;
  },
);
