import { BaseModel } from '.';
import { Column, DefaultScope } from 'sequelize-typescript';

@DefaultScope(() => ({
  attributes: {
    include: ['id', 'clinicId', 'nameEn', 'nameFr', 'code'],
  },
}))
export class LookupsModel extends BaseModel {
  @Column
  nameEn: string;

  @Column
  nameFr: string;
}
