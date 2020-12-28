import {
  Model,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  Column,
} from 'sequelize-typescript';

export class BaseModel extends Model<BaseModel> {
  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  @DeletedAt
  deleted_at: Date;

  @Column
  created_by: number;

  @Column
  updated_by: number;

  @Column
  deleted_by: number;
}
