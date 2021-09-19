import { Logger } from '@nestjs/common';
import { ErrorCodes } from '../../common/enums';
import { SCHEDULE_MGMT_TOPIC } from '../../common/constants';
import { AvailabilityModelAttributes } from './models/availability.interfaces';
import { AvailabilityEventPayload } from './events/availability-event-payload';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { snsTopic } = require('pubsub-service');

export enum AvailabilityEventName {
  AVAILABILITY_DELETED = 'AVAILABILITY_DELETED',
  AVAILABILITY_CREATED = 'AVAILABILITY_CREATED',
  AVAILABILITY_UPDATED = 'AVAILABILITY_UPDATED',
}

export class AvailabilityEventPublisher {
  private static readonly instance = new AvailabilityEventPublisher();

  private readonly logger = new Logger(AvailabilityEventPublisher.name);

  public static AVAILABILITY_CHANGE_TYPE = 'Availability';

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static getInstance() {
    return AvailabilityEventPublisher.instance;
  }

  public publishAvailabilityEvent(
    eventName: AvailabilityEventName,
    availability: AvailabilityModelAttributes,
    previousAvailability: AvailabilityModelAttributes,
    clinicId: number,
    triggeringMMXUser: number,
  ) {
    // A necessary work around for unit tests to work properly
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const payload: AvailabilityEventPayload = {
      eventName,
      changeType: AvailabilityEventPublisher.AVAILABILITY_CHANGE_TYPE,
      source: SCHEDULE_MGMT_TOPIC,
      clinicId: clinicId,
      triggeringMMXUser: triggeringMMXUser,
      doctorsAffected: this.getAffectedDoctors(availability, previousAvailability),
      availability: this.buildAvailabilitiesPayload(availability, previousAvailability),
    };
    snsTopic
      .sendSnsMessage(SCHEDULE_MGMT_TOPIC, {
        ...payload,
      })
      .catch((error) => {
        this.logger.error({
          message: `Failed publishing availability event: ${eventName}, payload = ${payload}`,
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          error: error,
        });
      });
  }

  getAffectedDoctors(availability: AvailabilityModelAttributes, previousAvailability: AvailabilityModelAttributes) {
    return [availability.staffId, previousAvailability?.staffId].filter((id) => id);
  }

  buildAvailabilitiesPayload(
    availability: AvailabilityModelAttributes,
    previousAvailability: AvailabilityModelAttributes,
  ) {
    return {
      id: availability.id,
      availability: this.mapAvailabilityAttributesToEventPayload(availability),
      availabilityBeforeUpdate: this.mapAvailabilityAttributesToEventPayload(previousAvailability),
    };
  }

  mapAvailabilityAttributesToEventPayload(availability: AvailabilityModelAttributes) {
    return availability
      ? {
          staffId: availability.staffId,
          startDate: availability.startDate,
          durationMinutes: availability.durationMinutes,
          isOccupied: availability.isOccupied,
        }
      : null;
  }
}
