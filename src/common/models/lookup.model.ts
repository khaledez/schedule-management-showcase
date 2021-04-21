import { BaseModel } from '.';
import { Column, DefaultScope } from 'sequelize-typescript';
import { BaseModelAttributes } from './base.model';

export interface LookupsModelAttributes extends BaseModelAttributes {
  nameEn: string;
  nameFr: string;
}

@DefaultScope(() => ({
  attributes: {
    exclude: ['deletedAt', 'deletedBy'],
  },
}))
export class LookupsModel<T, U = T> extends BaseModel<T, U> implements LookupsModelAttributes {
  @Column
  nameEn: string;

  @Column
  nameFr: string;
}
