import { CalendarType } from 'common/enums';
import { BaseModel } from 'common/models/base.model';
import { EventModel } from 'modules/events/models';
import {
  AfterBulkCreate,
  AfterCreate,
  AfterUpdate,
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasOne,
  IsDate,
  Scopes,
  Table,
} from 'sequelize-typescript';
import { AppointmentsModel } from '../../appointments/appointments.model';
import { AppointmentTypesLookupsModel } from '../../lookups/models/appointment-types.model';
import { AvailabilityCreationAttributes, AvailabilityModelAttributes } from './availability.interfaces';
import { AvailabilityEventName, AvailabilityEventPublisher } from '../availability.event-publisher';

@DefaultScope(() => ({
  attributes: {
    exclude: ['deletedAt', 'deletedBy'],
  },
}))
@Scopes(() => ({
  full: {
    exclude: ['deletedAt', 'deletedBy'],
    include: [
      {
        model: AppointmentTypesLookupsModel,
        as: 'type',
      },
    ],
  },
}))
@Table({ tableName: 'Availability', underscored: true })
export class AvailabilityModel
  extends BaseModel<AvailabilityModelAttributes, AvailabilityCreationAttributes>
  implements AvailabilityModelAttributes
{
  public static DATE_COLUMN = 'start_date';

  @Column
  staffId: number;

  @Column
  @ForeignKey(() => AppointmentTypesLookupsModel)
  appointmentTypeId: number;

  @Column
  isOccupied: boolean;

  @IsDate
  @Column
  startDate: Date;

  @IsDate
  @Column
  endDate: Date;

  @Column
  durationMinutes: number;

  @HasOne(() => AppointmentsModel)
  appointment?: AppointmentsModel;

  @HasOne(() => EventModel, 'availabilityId')
  event?: EventModel;

  @BelongsTo(() => AppointmentTypesLookupsModel, 'appointmentTypeId')
  type: AppointmentTypesLookupsModel;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      return 'CalendarAvailability';
    },
  })
  __typename: string;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      return CalendarType.AVAILABILITY;
    },
  })
  entryType: CalendarType;

  @AfterCreate
  static publishEventAfterCreate(instance: AvailabilityModel) {
    AvailabilityEventPublisher.getInstance().publishAvailabilityEvent(
      AvailabilityEventName.AVAILABILITY_CREATED,
      instance,
      null,
      instance.clinicId,
      instance.createdBy,
    );
  }

  @AfterUpdate
  static publishEventAfterUpdate(updatedAvailability) {
    if (updatedAvailability.changed().includes('deletedAt') || updatedAvailability.changed().includes('deletedBy')) {
      AvailabilityEventPublisher.getInstance().publishAvailabilityEvent(
        AvailabilityEventName.AVAILABILITY_DELETED,
        updatedAvailability,
        null,
        updatedAvailability.clinicId,
        updatedAvailability.deletedBy,
      );
      return;
    }
    AvailabilityEventPublisher.getInstance().publishAvailabilityEvent(
      AvailabilityEventName.AVAILABILITY_UPDATED,
      updatedAvailability,
      updatedAvailability._previousDataValues,
      updatedAvailability.clinicId,
      updatedAvailability.updatedBy,
    );
  }

  @AfterBulkCreate
  static publishEventAfterBulkCreate(instances) {
    instances.forEach((instance) => {
      AvailabilityEventPublisher.getInstance().publishAvailabilityEvent(
        AvailabilityEventName.AVAILABILITY_CREATED,
        instance,
        null,
        instance.clinicId,
        instance.createdBy,
      );
    });
  }
}
