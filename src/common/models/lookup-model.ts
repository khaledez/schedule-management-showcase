import { BaseModel } from '.';
import { Column } from 'sequelize-typescript';

export class LookupsModel extends BaseModel {
  @Column
  nameEn: string;

  @Column
  nameFr: string;
}
