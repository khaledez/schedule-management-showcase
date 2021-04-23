import { BelongsTo, Column, DataType, Scopes, Table } from 'sequelize-typescript';
import { BaseModel, BaseModelAttributes } from 'src/common/models';
import { AppointmentsModel, AppointmentsModelAttributes } from 'src/modules/appointments/models/appointments.model';
import { AvailabilityModelAttributes } from 'src/modules/availability/models/availability.interfaces';
import { AvailabilityModel } from 'src/modules/availability/models/availability.model';
import { Invitee } from '../events.interfaces';

export interface EventModelAttributes extends BaseModelAttributes {
  staffId: number;
  availabilityId?: number;
  appointmentId?: number;
  title?: string;
  location?: string;
  invitees?: Invitee[];
  descriptionRich?: string;
  colorCode?: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  durationMinutes: number;

  appointment?: AppointmentsModelAttributes;
  availability?: AvailabilityModelAttributes;
}

@Scopes(() => ({
  full: {
    exclude: ['deletedAt', 'deletedBy'],
    paranoid: true,
  },
}))
@Table({ tableName: 'Events', underscored: true })
export class EventModel extends BaseModel<EventModelAttributes> implements EventModelAttributes {
  @Column
  staffId: number;

  @Column
  availabilityId: number;
  @Column
  appointmentId: number;
  @Column
  title: string;
  @Column
  location: string;
  @Column(DataType.JSON)
  invitees: [Invitee];
  @Column
  descriptionRich: string;
  @Column
  colorCode: string;
  @Column({ field: 'date' })
  startDate: Date;

  @Column
  endDate: Date;
  @Column
  startTime: string;
  @Column
  durationMinutes: number;

  @BelongsTo(() => AppointmentsModel, 'appointmentId')
  appointment: AppointmentsModel;

  @BelongsTo(() => AvailabilityModel, 'availabilityId')
  availability: AvailabilityModel;
}
