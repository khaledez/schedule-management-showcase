import { Column, HasMany, Model, Table } from 'sequelize-typescript';
import { AvailabilityTemplateAttributes } from '../interfaces/availability-template.interface';
import { AvailabilityTemplateSlotModel } from './availability-template-slot.model';

@Table({ tableName: 'AvailabilityTemplate', underscored: true, paranoid: false })
export class AvailabilityTemplateModel
  extends Model<AvailabilityTemplateAttributes>
  implements AvailabilityTemplateAttributes {
  @Column
  name: string;

  @Column
  clinicId: number;

  @Column
  createdBy: number;

  @HasMany(() => AvailabilityTemplateSlotModel, { onDelete: 'CASCADE', foreignKey: 'availabilityTemplateId' })
  availabilitySlots: AvailabilityTemplateSlotModel[];
}
