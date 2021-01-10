import { registerDecorator, ValidationOptions } from 'class-validator';
import * as moment from 'moment';
// will use the same logic for past data

export function IsPastDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsPastDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'Please provide only future date',
        ...validationOptions,
      },
      validator: {
        validate(value: Date) {
          // i decrease a day from today to let 'today' passed.
          const isPastDate: boolean = moment().add(-1, 'days').diff(value) < 0;
          return isPastDate;
        },
      },
    });
  };
}
