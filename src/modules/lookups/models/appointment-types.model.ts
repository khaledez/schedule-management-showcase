import { Table, Column, HasMany } from 'sequelize-typescript';
import { LookupWithCodeAttributes } from '.';
import { LookupsModel } from '../../../common/models/lookup.model';
import { AppointmentsModel } from '../../appointments/models/appointments.model';
import { AvailabilityModel } from '../../availability/models/availability.model';

@Table({ tableName: 'AppointmentTypesLookups', underscored: true })
export class AppointmentTypesLookupsModel
  extends LookupsModel<LookupWithCodeAttributes>
  implements LookupWithCodeAttributes {
  @Column
  code: string;

  @HasMany(() => AppointmentsModel, 'appointmentTypeId')
  appointment?: AppointmentsModel[];

  @HasMany(() => AvailabilityModel, 'appointmentTypeId')
  availability?: AvailabilityModel[];
}
