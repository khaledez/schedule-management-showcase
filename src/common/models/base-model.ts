import { Model, CreatedAt, UpdatedAt, DeletedAt, Column } from 'sequelize-typescript';

// note that the id will auto added by sequelize.
export class BaseModel extends Model<BaseModel> {
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
