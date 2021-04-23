import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AvailabilityModel } from './models/availability.model';
import { AVAILABILITY_REPOSITORY, BAD_REQUEST, SEQUELIZE } from 'src/common/constants';
import { CreateAvailabilityDto } from './dto/create.dto';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Transaction } from 'sequelize/types';
import { BulkUpdateResult } from './interfaces/availability-bulk-update.interface';
import { AppointmentTypesLookupsModel } from '../lookups/models/appointment-types.model';
import { ErrorCodes } from 'src/common/enums/error-code.enum';
import { AvailabilityEdgesInterface } from './interfaces/availability-edges.interface';
import { UpdateAvailabilityDto } from './dto/update.dto';
import { BulkUpdateAvailabilityDto } from './dto/add-or-update-availability-body.dto';
import { DateTime } from 'luxon';
import { AvailabilityModelAttributes } from './models/availability.interfaces';
import { IIdentity } from '@mon-medic/common';
import { EventsService } from '../events/events.service';
import { EventModel, EventModelAttributes } from '../events/models';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: typeof AvailabilityModel,
    @Inject(SEQUELIZE)
    private readonly sequelize: Sequelize,
    private readonly eventsService: EventsService,
  ) {}

  async findAll({ identity }): Promise<AvailabilityEdgesInterface> {
    const { clinicId } = identity;
    const availability = await this.availabilityRepository.findAll({
      include: [
        {
          model: AppointmentTypesLookupsModel,
          as: 'type',
        },
      ],
      where: {
        clinicId,
      },
    });
    const availabilityAsPlain = availability.map((e) => e.get({ plain: true }));
    return {
      edges: availabilityAsPlain.map((e: AvailabilityModel) => ({
        cursor: e.id,
        node: e,
      })),
      pageInfo: {},
    };
  }

  async findOne(id: number): Promise<AvailabilityModel> {
    const availability = await this.availabilityRepository.findByPk(id, {
      include: [
        {
          model: AppointmentTypesLookupsModel,
          as: 'type',
        },
      ],
    });
    if (!availability) {
      throw new NotFoundException({
        fields: [],
        code: 'NOT_FOUND',
        message: 'This availability does not exits!',
      });
    }
    return availability;
  }

  async findNotBookedAvailability(availabilityId: number): Promise<AvailabilityModel> {
    const availability = await this.availabilityRepository.findOne({
      where: {
        id: availabilityId,
        appointmentId: {
          [Op.eq]: null,
        },
      },
    });
    return availability;
  }

  /**
   *
   * @param ids array of availability ids to be deleted
   *
   */
  private async bulkRemove(ids: Array<number>, identity: IIdentity, transaction: Transaction): Promise<Array<number>> {
    try {
      const availPromise = this.availabilityRepository.update(
        {
          deletedBy: identity.userId,
          deletedAt: new Date(),
        },
        {
          where: {
            id: {
              [Op.in]: ids,
            },
          },
          transaction,
        },
      );

      // TODO use Model.destroy to remove events
      const eventPromise = this.eventsService.bulkRemoveByAvailability(identity, ids, transaction);

      await Promise.all([availPromise, eventPromise]);

      return ids;
    } catch (error) {
      throw new InternalServerErrorException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'Error occur while delete bulk availability',
        error,
      });
    }
  }

  private async bulkUpdate(
    update: Array<UpdateAvailabilityDto>,
    identity: IIdentity,
    transaction: Transaction,
  ): Promise<AvailabilityModelAttributes[]> {
    const { availabilityUpdates, eventUpdates, ids } = update
      .map((dto): [AvailabilityModelAttributes, EventModelAttributes, number] => {
        const baseAttr = {
          updatedBy: identity.userId,
          clinicId: identity.clinicId,
          ...dto,
        };

        const avModel = timeInfoFromDtoToModel(baseAttr, dto.startDate, dto.durationMinutes);

        return [avModel, availabilityToEventModel(avModel), avModel.id];
      })
      .map(([availability, event, avId]): [Promise<AvailabilityModel[]>, Promise<EventModel[]>, number] => {
        // here we're not using bulkCreate as it will fail in MySQL if some required info are missing (staffId, createdBy)
        return [
          AvailabilityModel.update(availability, { transaction, where: { id: availability.id } }).then((r) => r[1]),
          EventModel.update(event, { where: { availabilityId: availability.id }, transaction }).then((r) => r[1]),
          avId,
        ];
      })
      .reduce(
        (acc, [availability, event, avId]) => {
          acc.availabilityUpdates.push(availability);
          acc.eventUpdates.push(event);
          acc.ids.push(avId);
          return acc;
        },
        { availabilityUpdates: [], eventUpdates: [], ids: [] } as UpdatePair,
      );
    await eventUpdates;
    await Promise.all(availabilityUpdates);

    return AvailabilityModel.findAll({ transaction, plain: true, where: { id: { [Op.in]: ids } } });
  }

  private async bulkCreate(
    create: Array<CreateAvailabilityDto>,
    identity: IIdentity,
    transaction: Transaction,
  ): Promise<AvailabilityModelAttributes[]> {
    const createInput = create.map((dto) => {
      const avAttr = {
        clinicId: identity.clinicId,
        createdBy: identity.userId,
        ...dto,
      };

      const avModel = timeInfoFromDtoToModel(avAttr, dto.startDate, dto.durationMinutes);

      return availabilityToEventModel(avModel);
    });

    const createExec: Promise<EventModel[]> =
      createInput.length > 0
        ? EventModel.bulkCreate(createInput, {
            transaction,
            include: { model: AvailabilityModel, as: 'availability' },
          })
        : Promise.resolve([]);

    return (await createExec).map((ev) => ev.availability);
  }

  findByIds(ids: number[]): Promise<AvailabilityModel[]> {
    this.logger.log({ functionName: this.findByIds.name, ids });
    return this.availabilityRepository.scope('full').findAll({
      where: {
        id: ids,
      },
    });
  }

  async bulkAction(identity: IIdentity, payload: BulkUpdateAvailabilityDto): Promise<BulkUpdateResult> {
    // prevent any conflicts between remove & update
    // a. make sure user is not updating && deleting the same availability
    if (payload?.update?.filter((updReq) => payload?.remove?.includes(updReq.id))?.length > 0) {
      throw new BadRequestException({
        code: BAD_REQUEST,
        message: 'You cannot update & delete the same record in the same time',
      });
    }
    // b. make sure update list has no duplicate ids
    const uniqueIds = new Set(payload?.update?.map((updReq) => updReq.id));
    if (uniqueIds.size > 0 && payload?.update?.length !== uniqueIds.size) {
      throw new BadRequestException({
        code: BAD_REQUEST,
        message: 'duplicate entries in the update list',
      });
    }

    try {
      return await this.sequelize.transaction(async (transaction: Transaction) => {
        this.logger.debug(payload);

        // update
        const updatedP: Promise<AvailabilityModelAttributes[]> = payload.update
          ? this.bulkUpdate(payload.update, identity, transaction)
          : Promise.resolve([]);

        // create
        const createdP: Promise<AvailabilityModelAttributes[]> = payload.create
          ? this.bulkCreate(payload.create, identity, transaction)
          : Promise.resolve([]);

        // remove
        if (payload.remove?.length) {
          await this.bulkRemove(payload.remove, identity, transaction);
        }

        const [updated, created] = await Promise.all([updatedP, createdP]);

        return { created, updated: Array.isArray(updated) ? updated : [updated] };
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }
}

interface UpdatePair {
  availabilityUpdates: Array<Promise<AvailabilityModel[]>>;
  eventUpdates: Array<Promise<EventModel[]>>;
  ids: Array<number>;
}

function timeInfoFromDtoToModel(
  avModel: {
    staffId: number;
    durationMinutes: number;
    appointmentTypeId: number;
  },
  startDate: string,
  durationMinutes: number,
): AvailabilityModelAttributes {
  const isoDate = DateTime.fromISO(startDate);
  // TODO check if we don't have the timezone in the date
  return {
    ...avModel,
    startDate: isoDate.toJSDate(),
    startTime: isoDate.toSQLTime({ includeZone: false, includeOffset: false }),
    endDate: isoDate.plus({ minutes: durationMinutes }).toJSDate(),
  };
}

function availabilityToEventModel(avModel: AvailabilityModelAttributes): EventModelAttributes {
  return {
    availability: avModel,
    durationMinutes: avModel.durationMinutes,
    startDate: avModel.startDate,
    startTime: avModel.startTime,
    endDate: avModel.endDate,
    availabilityId: avModel.id,
    staffId: avModel.staffId,
    clinicId: avModel.clinicId,
    createdBy: avModel.createdBy,
    updatedBy: avModel.updatedBy,
  };
}
