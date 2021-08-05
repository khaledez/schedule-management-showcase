import { UserError } from 'common/interfaces/user-error.interface';
import { PageInfo } from 'common/interfaces/page-info';

export interface Connection<T> {
  edges: ConnectionEdge<T>[];
  pageInfo?: PageInfo;
  errors?: UserError[];
}

export interface ConnectionEdge<T> {
  node: T;
  cursor: number;
}
