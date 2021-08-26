import { CalendarType } from 'common/enums';
import { CalendarEntry } from 'common/interfaces/calendar-entry';
import { BelongsTo, Column, DataType, Scopes, Table } from 'sequelize-typescript';
import { BaseModel } from '../../../common/models';
import { AvailabilityModelAttributes } from '../../availability/models/availability.interfaces';
import { AvailabilityModel } from '../../availability/models/availability.model';
import { Invitee } from '../events.interfaces';

export interface EventModelAttributes extends CalendarEntry {
  availabilityId?: number;
  title?: string;
  location?: string;
  invitees?: Invitee[];
  descriptionRich?: string;
  colorCode?: string;

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
  startDate: Date;

  @Column
  endDate: Date;
  @Column
  durationMinutes: number;

  @BelongsTo(() => AvailabilityModel, 'availabilityId')
  availability: AvailabilityModel;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      return 'CalendarEvent';
    },
  })
  __typename: string;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      return CalendarType.EVENT;
    },
  })
  entryType: CalendarType;
}
