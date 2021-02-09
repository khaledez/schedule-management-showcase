/* eslint-disable no-unused-vars */
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraintInterface,
  // ValidationArguments,
  ValidatorConstraint,
} from 'class-validator';
// import * as moment from 'moment';
// will use the same logic for past data

//TODO: check how you could inject repository here.
@ValidatorConstraint({ async: true })
export class IsValidForeignKeyConstraint
  implements ValidatorConstraintInterface {
  validate() {
    // id: any, args: ValidationArguments
    return true;
    // return Repository.findOneByName(id).then((user) => {
    //   if (user) return false;
    //   return true;
    // });
  }
}

export function IsValidForeignKey(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidForeignKeyConstraint,
    });
  };
}
