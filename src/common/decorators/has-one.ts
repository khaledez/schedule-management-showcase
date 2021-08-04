import { registerDecorator } from 'class-validator';

/**
 * Validator to check if at least one of the given properties is not null
 */
export function HasOne(fields: string[]) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'HasOneNonNullOf',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: `${propertyName} Please provide one of the Fields: [${fields}]`,
      },
      validator: {
        validate(object: any) {
          if (!object) {
            return true;
          }
          if (typeof object !== 'object') {
            return false;
          }
          for (const field of fields) {
            if (object[field]) {
              return true;
            }
          }
          return false;
        },
      },
    });
  };
}
