import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Validator to check if the given date is in the future
 */
export function IsFutureDateTime(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsFutureDateTime',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: `${propertyName} Please provide only future dates`,
        ...validationOptions,
      },
      validator: {
        validate(value: Date) {
          const timeDifference: number = new Date(value).getTime() - new Date().getTime();
          return timeDifference > 0;
        },
      },
    });
  };
}
