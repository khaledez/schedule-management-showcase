import { Column, DataType, Scopes, Table } from 'sequelize-typescript';
import { BaseModel, BaseModelAttributes } from 'src/common/models';
import { Invitee } from '../events.interfaces';

export interface EventModelAttributes extends BaseModelAttributes {
  staffId?: number;
  availabilityId?: number;
  appointmentId?: number;
  title?: string;
  location?: string;
  invitees?: Invitee[];
  descriptionRich?: string;
  colorCode?: string;
  date: Date;
  endDate: Date;
  startTime: string;
  durationMinutes: number;
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
  @Column
  date: Date;
  @Column
  endDate: Date;
  @Column
  startTime: string;
  @Column
  durationMinutes: number;
}
