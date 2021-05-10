import { Model, CreatedAt, UpdatedAt, DeletedAt, Column } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

export interface BaseModelAttributes {
  id?: number;
  clinicId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
  deletedBy?: number;
}

export type BaseModelCreationAttributes = Optional<
  BaseModelAttributes,
  'id' | 'createdAt' | 'updatedBy' | 'updatedAt' | 'deletedAt' | 'deletedBy'
>;

// note that the id will auto added by sequelize.
export class BaseModel<T, U = T> extends Model<T, U> {
  @Column
  clinicId: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  @Column
  createdBy: number;

  @Column
  updatedBy: number;

  @Column
  deletedBy: number;
}
