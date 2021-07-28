import { PageInfo } from '.';

export interface Connection<T> {
  edges: ConnectionEdge<T>[];
  pageInfo?: PageInfo;
}

export interface ConnectionEdge<T> {
  node: T;
}
