import { FilterDateInputDto, FilterIdsInputDto } from '@mon-medic/common';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { Includeable, Op, Sequelize, WhereAttributeHash, WhereOptions } from 'sequelize';
import { BAD_REQUEST, EVENTS_REPOSITORY, SEQUELIZE } from 'src/common/constants';
import { AppointmentsModel } from '../appointments/models/appointments.model';
import { AvailabilityModel } from '../availability/models/availability.model';
import { EventModel } from '../events/models';
import {
  CalendarAppointment,
  CalendarAvailability,
  CalendarEvent,
  CalendarSearchInput,
  CalendarSearchResult,
} from './calendar.interface';

@Injectable()
export class CalendarService {
  constructor(
    @Inject(SEQUELIZE) private readonly sequelize: Sequelize,
    @Inject(EVENTS_REPOSITORY) private readonly eventsModel: EventModel,
  ) {}

  async search(query: CalendarSearchInput): Promise<CalendarSearchResult> {
    const queryType = query.entryType?.eq ? query.entryType?.eq : 'AVAILABILITY';
    // TODO think of a way to use timezoneId
    let eventConditions: WhereOptions<EventModel> = {
      deletedBy: {
        [Op.is]: null,
      },
    };

    if (query.staffId) {
      eventConditions = { ...eventConditions, ...processIdCondition('staffId', 'staffId', query.staffId) };
    }

    if (query.dateRange) {
      eventConditions = { ...eventConditions, ...processDateCondition('date', 'dateRange', query.dateRange) };
    }

    const toInclude: Includeable[] = [];
    if (queryType === 'AVAILABILITY') {
      toInclude.push({
        model: AvailabilityModel,
        required: true,
        foreignKey: 'availabiltyId',
        where: availabilityFilters(query),
      });
    }

    if (queryType === 'APPOINTMENT') {
      toInclude.push({ model: AppointmentsModel, required: true });
    }
    const result = await EventModel.findAll({ where: eventConditions, include: toInclude });

    const entries = result
      .map((el) => el.get({ plain: true }))
      .map((model) => {
        if (queryType === 'EVENT') {
          return {
            ...model,
            entryType: 'EVENT',
            startDate: model.date,
          } as CalendarEvent;
        } else if (queryType === 'APPOINTMENT') {
          const { date, ...appt } = model.appointment;
          return {
            ...appt,
            entryType: 'APPOINTMENT',
            startDate: DateTime.fromSQL(date).toJSDate(),
            provisionalDate: model.appointment.provisionalDate
              ? DateTime.fromSQL(model.appointment.provisionalDate).toJSDate()
              : undefined,
            staffId: model.appointment.doctorId,
          } as CalendarAppointment;
        }

        return {
          ...model.availability,
          entryType: 'AVAILABILITY',
          startDate: model.date,
          staffId: model.availability.doctorId,
        } as CalendarAvailability;
      });
    return { entries };
  }
}

function processDateCondition(
  columnName: string,
  filterName: string,
  filter: FilterDateInputDto,
): { [key: string]: WhereAttributeHash } {
  // eq and between are only supported
  if (![filter.ne, filter.ge, filter.gt, filter.lt].every((el) => !el)) {
    throw new BadRequestException({
      fields: [filterName],
      message: 'unsupported filter operation, supported: between, eq',
      code: BAD_REQUEST,
    });
  }

  if (filter.between && filter.eq) {
    throw new BadRequestException({
      fields: [filterName],
      message: 'only one filter at a time is supported',
      code: BAD_REQUEST,
    });
  }

  if (filter.eq) {
    return { [columnName]: { [Op.eq]: DateTime.fromJSDate(filter.eq).toSQLDate() } };
  }

  if (filter.between) {
    return {
      [columnName]: {
        [Op.between]: [
          DateTime.fromJSDate(filter.between[0]).toSQLDate(),
          DateTime.fromJSDate(filter.between[1]).toSQLDate(),
        ],
      },
    };
  }

  return undefined;
}

function processIdCondition(
  columnName: string,
  filterName: string,
  filter: FilterIdsInputDto,
): { [key: string]: WhereAttributeHash } {
  // eq and in are only supported
  if (
    ![
      filter.ne,
      filter.ge,
      filter.gt,
      filter.lt,
      filter.beginsWith,
      filter.between,
      filter.contains,
      filter.or,
      filter.notContains,
      filter.notContains,
    ].every((el) => !el)
  ) {
    throw new BadRequestException({
      fields: [filterName],
      message: 'unsupported filter operation, supported: in, eq',
      code: BAD_REQUEST,
    });
  }
  if (filter.in && filter.eq) {
    throw new BadRequestException({
      fields: [filterName],
      message: 'only one filter at a time is supported',
      code: BAD_REQUEST,
    });
  }

  if (filter.eq) {
    return { [columnName]: { [Op.eq]: filter.eq } };
  }

  if (filter.in) {
    return { [columnName]: { [Op.in]: filter.in } };
  }

  return {};
}

function availabilityFilters(query: CalendarSearchInput): WhereOptions<AvailabilityModel> {
  let availConditions: WhereOptions<AvailabilityModel> = {
    deletedBy: {
      [Op.is]: null,
    },
  };

  if (query.availabilityFilter?.appointmentTypeId) {
    availConditions = {
      ...processIdCondition(
        'appointmentTypeId',
        'availabilityFilter.appointmentTypeId',
        query.availabilityFilter.appointmentTypeId,
      ),
      ...availConditions,
    };
  }

  if (query.availabilityFilter?.withAppointment) {
    availConditions = {
      ...availConditions,
      appointmentId: {
        [Op.not]: null,
      },
    };
  }

  return availConditions;
}
