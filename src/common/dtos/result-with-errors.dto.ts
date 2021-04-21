import { UserError } from '../interfaces/user-error.interface';

export interface ResultWithErrors {
  errors?: UserError[];
}
