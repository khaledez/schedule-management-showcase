import { IIdentity } from '@dashps/monmedx-common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DEFAULT_EVENT_DURATION_MINS, EVENTS_REPOSITORY } from 'common/constants';
import { DateTime } from 'luxon';
import { AvailabilityModel } from 'modules/availability/models/availability.model';
import { Transaction } from 'sequelize';
import { EventCreateRequest, EventUpdateRequest, Invitee } from './events.interfaces';
import { EventModel, EventModelAttributes } from './models';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(@Inject(EVENTS_REPOSITORY) private readonly eventModel: typeof EventModel) {}

  create(identity: IIdentity, input: EventCreateRequest, transaction?: Transaction): Promise<EventModel> {
    this.logger.debug({
      title: 'create new event',
      input,
    });
    const payload = mapDtoToModelAttr(identity, input);

    this.logger.debug({
      title: 'after map dto to attribute',
      payload,
    });

    return this.eventModel.create(payload, { transaction, include: AvailabilityModel });
  }

  async update(identity: IIdentity, input: EventUpdateRequest): Promise<EventModel> {
    await this.eventModel.update(mapDtoToModelAttr(identity, input), {
      where: { id: input.id, clinicId: identity.clinicId },
    });

    return this.findOne(input.id);
  }

  async remove(identity: IIdentity, eventId: number): Promise<void> {
    await this.eventModel.update({ deletedAt: new Date(), deletedBy: identity.userId }, { where: { id: eventId } });
  }

  findOne(eventId: number): Promise<EventModel> {
    return this.eventModel.scope('full').findByPk(eventId);
  }
}

function mapDtoToModelAttr(identity: IIdentity, input: EventCreateRequest | EventUpdateRequest): EventModelAttributes {
  const startDate = DateTime.fromJSDate(input.startDate);
  const endDate = startDate.plus({ minutes: input.durationMinutes || DEFAULT_EVENT_DURATION_MINS }).toJSDate();
  return {
    ...input,
    clinicId: identity.clinicId,
    createdBy: identity.userId,
    startTime: startDate.toSQLTime({ includeOffset: false, includeZone: false }),
    durationMinutes: input.durationMinutes || DEFAULT_EVENT_DURATION_MINS,
    endDate,
    invitees: input.invitees?.map(
      (i) =>
        ({
          email: i.email,
        } as Invitee),
    ),
    availability: {
      appointmentTypeId: 1, // TODO create a global appointment type called event
      staffId: input.staffId,
      startDate: input.startDate,
      durationMinutes: input.durationMinutes || DEFAULT_EVENT_DURATION_MINS,
      endDate,
      clinicId: identity.clinicId,
      createdBy: identity.userId,
      isOccupied: true,
    },
  };
}
