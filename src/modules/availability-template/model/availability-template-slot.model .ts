import { AppointmentTypesLookupsModel } from 'modules/lookups/models/appointment-types.model';
import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import { AvailabilitySlotAttributes } from '../interfaces/availability-template-slot.interface';
import { AvailabilityTemplateModel } from './availability-template.model';

@Table({ tableName: 'AvailabilityTemplateSlot', underscored: true, paranoid: false })
export class AvailabilityTemplateSlotModel
  extends Model<AvailabilitySlotAttributes>
  implements AvailabilitySlotAttributes
{
  @Column
  clinicId: number;

  @Column
  @ForeignKey(() => AvailabilityTemplateModel)
  availabilityTemplateId: number;

  @Column
  @ForeignKey(() => AppointmentTypesLookupsModel)
  appointmentTypeId: number;

  @Column
  startTime: string;

  @Column
  durationMinutes: number;
}
