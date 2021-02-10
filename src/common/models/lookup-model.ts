import { BaseModel } from '.';
import { Column, DefaultScope } from 'sequelize-typescript';

@DefaultScope(() => ({
  attributes: {
    exclude: ['deletedAt', 'deletedBy'],
  },
}))
export class LookupsModel extends BaseModel {
  @Column
  nameEn: string;

  @Column
  nameFr: string;
}
