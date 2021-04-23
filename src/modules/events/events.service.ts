import { IIdentity } from '@mon-medic/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { Op, Transaction } from 'sequelize';
import { DEFAULT_EVENT_DURATION_MINS, EVENTS_REPOSITORY } from '../../common/constants';
import { EventCreateRequest, EventUpdateRequest, Invitee } from './events.interfaces';
import { EventModel, EventModelAttributes } from './models';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(@Inject(EVENTS_REPOSITORY) private readonly eventModel: typeof EventModel) {}

  create(identity: IIdentity, input: EventCreateRequest): Promise<EventModel> {
    return this.eventModel.create(mapDtoToModelAttr(identity, input));
  }

  async addAppointmentToEventByAvailability(
    userId: number,
    availbilityId: number,
    appointmentId: number,
  ): Promise<void> {
    await this.eventModel.update(
      { appointmentId: appointmentId, updatedBy: userId, updatedAt: new Date() },
      { where: { availabilityId: availbilityId } },
    );
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

  async bulkRemoveByAvailability(identity: IIdentity, ids: number[], transaction?: Transaction): Promise<void> {
    await this.eventModel.update(
      { deletedAt: new Date(), deletedBy: identity.userId },
      { where: { availabilityId: { [Op.in]: ids } }, transaction },
    );
  }

  findOne(eventId: number): Promise<EventModel> {
    return this.eventModel.scope('full').findByPk(eventId);
  }
}

function mapDtoToModelAttr(identity: IIdentity, input: EventCreateRequest | EventUpdateRequest): EventModelAttributes {
  const startDate = DateTime.fromJSDate(input.startDate);
  return {
    ...input,
    clinicId: identity.clinicId,
    createdBy: identity.userId,
    startTime: startDate.toSQLTime({ includeOffset: false, includeZone: false }),
    durationMinutes: input.durationMinutes || DEFAULT_EVENT_DURATION_MINS,
    endDate: startDate.plus({ minutes: input.durationMinutes || DEFAULT_EVENT_DURATION_MINS }).toJSDate(),
    invitees: input.invitees?.map(
      (i) =>
        ({
          email: i.email,
        } as Invitee),
    ),
  };
}
