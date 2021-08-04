import { FilterDateInputDto, IIdentity } from '@dashps/monmedx-common';
import { FilterIdsInputDto } from '@dashps/monmedx-common/src/dto/filter-ids-input.dto';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  APPOINTMENT_PROXIMITY_DAYS,
  APPOINTMENT_SUGGESTIONS_QUERY_LIMIT,
  APPOINTMENT_SUGGESTIONS_RETURN_LIMIT,
  AVAILABILITY_REPOSITORY,
  BAD_REQUEST,
  DAY_TO_MILLI_SECOND,
  SEQUELIZE,
} from 'common/constants';
import { ErrorCodes } from 'common/enums';
import { CalendarType } from 'common/enums/calendar-type';
import { getTimeGroup, isInTimeGroup } from 'common/enums/time-group';
import { CalendarEntry } from 'common/interfaces/calendar-entry';
import { TimeGroup } from 'common/interfaces/time-group-period';
import { DateTime } from 'luxon';
import { AppointmentsService } from 'modules/appointments/appointments.service';
import { GetSuggestionsDto } from 'modules/availability/dto/GetSuggestionsDto';
import { LookupsService } from 'modules/lookups/lookups.service';
import sequelize, { FindOptions, Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize/types';
import { EventsService } from '../events/events.service';
import { EventModel, EventModelAttributes } from '../events/models';
import { AppointmentTypesLookupsModel } from '../lookups/models/appointment-types.model';
import { BulkUpdateAvailabilityDto } from './dto/add-or-update-availability-body.dto';
import { CreateAvailabilityDto } from './dto/create.dto';
import { UpdateAvailabilityDto } from './dto/update.dto';
import { BulkUpdateResult } from './interfaces/availability-bulk-update.interface';
import { AvailabilityEdgesInterface } from './interfaces/availability-edges.interface';
import { AvailabilityModelAttributes } from './models/availability.interfaces';
import { AvailabilityModel } from './models/availability.model';
import { SearchAvailabilityDto } from 'modules/availability/dto/search-availability-dto';
import { AvailabilityCountForDay } from 'common/interfaces/availability-count-for-day';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: typeof AvailabilityModel,
    @Inject(SEQUELIZE)
    private readonly sequelize: Sequelize,
    private readonly eventsService: EventsService,
    private readonly lookupsService: LookupsService,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
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

  async doesExist(id: number): Promise<boolean> {
    const availability = await this.availabilityRepository.findByPk(id);
    return availability !== null;
  }

  /**
   *
   * @param ids array of availability ids to be deleted
   *
   */
  async bulkRemove(ids: Array<number>, identity: IIdentity, transaction: Transaction): Promise<Array<number>> {
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

  async bulkCreate(
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
    await this.validateAppointmentTypesIds(identity, payload);
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

  async validateAppointmentTypesIds(identity: IIdentity, payload: BulkUpdateAvailabilityDto) {
    const ids = [];
    payload.create?.forEach((item) => ids.push(item.appointmentTypeId));
    payload.update?.forEach((item) => ids.push(item.appointmentTypeId));
    await this.lookupsService.validateAppointmentsTypes(identity, ids);
  }

  /**
   * Returns nine suggestions for the next appointment according to the given details
   * The suggested availabilities will have the same appointmentType as passed in the request.
   * In addition the result will be sorted with the highest priority coming first.
   */
  async getAvailabilitySuggestions(identity: IIdentity, payload: GetSuggestionsDto): Promise<CalendarEntry[]> {
    const appointmentTypeId: number = payload.appointmentTypeId;
    const isValid: boolean = await this.lookupsService.doesAppointmentTypeExist(payload.appointmentTypeId);
    if (!isValid) {
      throw new BadRequestException({
        fields: ['appointmentTypeId'],
        message: 'Unknown appointment type',
        code: BAD_REQUEST,
      });
    }
    const referenceDate: Date = await this.pickReferenceDate(payload.referenceDate, payload.patientId);
    const suggestions: AvailabilityModel[] = await this.getSuggestions(
      identity.clinicId,
      referenceDate,
      appointmentTypeId,
      payload.staffId,
    );
    if (payload.timeGroup) {
      const timeGroup: TimeGroup = getTimeGroup(payload.timeGroup);
      const sortComparator = this.getSuggestionsPriorityComparator(timeGroup);
      suggestions.sort(sortComparator);
    }
    return suggestions.slice(0, APPOINTMENT_SUGGESTIONS_RETURN_LIMIT).map((suggest) => this.toCalendarEntry(suggest));
  }

  getSuggestionsPriorityComparator(timeGroup: TimeGroup) {
    // eslint-disable-next-line complexity
    return (suggestionA: AvailabilityModelAttributes, suggestionB: AvailabilityModelAttributes): number => {
      if (isInTimeGroup(suggestionA.startDate, timeGroup) && isInTimeGroup(suggestionB.startDate, timeGroup)) {
        return suggestionA.startDate.getTime() - suggestionB.startDate.getTime();
      }
      if (isInTimeGroup(suggestionA.startDate, timeGroup)) {
        return -1;
      }
      if (isInTimeGroup(suggestionB.startDate, timeGroup)) {
        return 1;
      }
      return suggestionA.startDate.getTime() - suggestionB.startDate.getTime();
    };
  }

  async pickReferenceDate(explicitDate: string, patientId: number): Promise<Date> {
    if (explicitDate) {
      return new Date(explicitDate);
    }
    const appointment = await this.appointmentsService.getPatientProvisionalAppointment(patientId);
    if (appointment) {
      return appointment.provisionalDate;
    }
    return new Date();
  }

  getSuggestions(
    clinicId: number,
    referenceDate: Date,
    appointmentTypeId: number,
    staffId: FilterIdsInputDto,
  ): Promise<AvailabilityModel[]> {
    const dateWhereClause = this.getSuggestionsDateWhereClause(referenceDate);
    const staffIWhereClause = this.getEntityIdWhereClause(staffId);
    const options: FindOptions = {
      where: {
        appointmentId: { [Op.is]: null },
        clinicId,
        appointmentTypeId,
        date: dateWhereClause,
        staffId: staffIWhereClause,
      },
      order: [
        [
          sequelize.fn(
            'ABS',
            sequelize.fn('TIMESTAMPDIFF', sequelize.literal('SECOND'), sequelize.col('date'), referenceDate),
          ),
          'ASC',
        ],
      ],
      limit: APPOINTMENT_SUGGESTIONS_QUERY_LIMIT,
    };
    return this.availabilityRepository.findAll(options);
  }

  getSuggestionsDateWhereClause(referenceDate: Date) {
    const currentDateTime = new Date().getTime();
    const referenceDateTime = referenceDate.getTime();
    const lowerDateBound = new Date(
      Math.max(currentDateTime, referenceDateTime - APPOINTMENT_PROXIMITY_DAYS * DAY_TO_MILLI_SECOND),
    );
    const upperDateBound = new Date(referenceDateTime + APPOINTMENT_PROXIMITY_DAYS * DAY_TO_MILLI_SECOND);
    return { [Op.between]: [lowerDateBound, upperDateBound] };
  }

  getEntityIdWhereClause(entity: FilterIdsInputDto) {
    if (entity && entity.in) {
      return { [Op.in]: entity.in };
    } else if (entity && entity.eq) {
      return { [Op.eq]: entity.eq };
    }
    return { [Op.notIn]: [] };
  }

  async getAvailabilitiesCount(
    identity: IIdentity,
    payload: SearchAvailabilityDto,
  ): Promise<AvailabilityCountForDay[]> {
    const availabilities = await this.searchForAvailabilities(identity, payload);
    const map: Map<string, number> = new Map();
    availabilities.forEach((availability) => {
      const key = availability.startDate.toISOString().match(/\d{4}-\d{2}-\d{2}/)[0];
      const count = map.has(key) ? map.get(key) : 0;
      map.set(key, count + 1);
    });
    return [...map].map(([date, count]) => ({ date, count }));
  }

  async searchForAvailabilities(identity: IIdentity, payload: SearchAvailabilityDto): Promise<CalendarEntry[]> {
    const dateWhereClause = this.getAvailabilitySearchDateWhereClause(payload.dateRange);
    const staffIdWhereClause = this.getEntityIdWhereClause(payload.staffId);
    const appointmentTypeIdWhereClause = this.getEntityIdWhereClause(payload.appointmentTypeId);
    const options: FindOptions = {
      where: {
        appointmentTypeId: appointmentTypeIdWhereClause,
        date: dateWhereClause,
        staffId: staffIdWhereClause,
        clinicId: identity.clinicId,
      },
      order: [['date', 'ASC']],
    };
    let result = await this.availabilityRepository.findAll(options);
    if (payload.timeGroup) {
      const timeGroup: TimeGroup = getTimeGroup(payload.timeGroup);
      result = result.filter((availability) => isInTimeGroup(availability.startDate, timeGroup));
    }
    return result.map((availability) => this.toCalendarEntry(availability));
  }

  getAvailabilitySearchDateWhereClause(dateRange: FilterDateInputDto) {
    // Set endTime to 23:59:59 due to sequelize limitations
    if (dateRange.between) {
      dateRange.between[1].setUTCHours(23, 59, 59, 999);
      return { [Op.between]: dateRange.between };
    } else if (dateRange.eq) {
      const end = new Date(dateRange.eq.getTime());
      end.setUTCHours(23, 59, 59, 999);
      return { [Op.between]: [dateRange.eq, end] };
    }
    return { [Op.notIn]: [] };
  }

  toCalendarEntry(availability: AvailabilityModelAttributes): CalendarEntry {
    return {
      __typename: 'CalendarAvailability',
      id: availability.id,
      clinicId: availability.clinicId,
      staffId: availability.staffId,
      startDate: availability.startDate,
      endDate: availability.endDate,
      entryType: CalendarType.AVAILABILITY,
      createdBy: availability.createdBy,
      createdAt: availability.createdAt,
      updatedBy: availability.updatedBy,
      updatedAt: availability.updatedAt,
      durationMinutes: availability.durationMinutes,
    };
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
