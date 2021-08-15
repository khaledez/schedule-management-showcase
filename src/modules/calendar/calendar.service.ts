import { FilterDateInputDto, FilterIdsInputDto, FilterStringInputDto, IIdentity } from '@dashps/monmedx-common';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AvailabilityModelAttributes } from 'modules/availability/models/availability.interfaces';
import { LookupsService } from 'modules/lookups/lookups.service';
import { Op, WhereAttributeHash, WhereOptions } from 'sequelize';
import { BAD_REQUEST } from 'common/constants';
import { AppointmentsModel, AppointmentsModelAttributes } from '../appointments/appointments.model';
import { AvailabilityModel } from '../availability/models/availability.model';
import { EventModel, EventModelAttributes } from '../events/models';
import { CalendarAvailability, CalendarSearchInput, CalendarSearchResult } from './calendar.interface';
import { CalendarType } from 'common/enums';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private readonly lookupService: LookupsService) {}

  // eslint-disable-next-line complexity
  async search(identity: IIdentity, query: CalendarSearchInput): Promise<CalendarSearchResult> {
    this.logger.debug({
      method: 'CalenderService/search',
      query,
    });

    const queryType = new EntryType(query.entryType);

    const appointments = await this.searchAppointments(identity, query, queryType);
    const events = await this.searchEvents(identity, query, queryType);
    const availabilities = await this.searchAvailabilities(identity, query, queryType);
    await Promise.all([appointments, events, availabilities]);
    const entries = [];
    appointments
      .map((appt) => appt.get({ plain: true }))
      .forEach((appt) => entries.push(appointmentAsCalendarEvent(appt)));
    events.map((event) => event.get({ plain: true })).forEach((event) => entries.push(eventAsCalendarEvent(event)));
    availabilities
      .map((availability) => availability.get({ plain: true }))
      .forEach((availability) => entries.push(availabilityAsCalendarEvent(availability)));

    return { entries };
  }

  async searchAppointments(
    identity: IIdentity,
    query: CalendarSearchInput,
    queryType: EntryType,
  ): Promise<AppointmentsModel[]> {
    if (!queryType.hasType(CalendarType.APPOINTMENT)) {
      return [];
    }
    const provisionalStatusId = await this.lookupService.getProvisionalAppointmentStatusId(identity);
    let appointmentWhereClauses: WhereOptions<AppointmentsModel> = {
      clinicId: { [Op.eq]: identity.clinicId },
      appointmentStatusId: { [Op.ne]: provisionalStatusId },
      deletedBy: { [Op.is]: null },
    };

    if (query.staffId) {
      appointmentWhereClauses = {
        ...appointmentWhereClauses,
        ...processIdCondition('staffId', 'staffId', query.staffId),
      };
    }

    if (query.dateRange) {
      appointmentWhereClauses = {
        ...appointmentWhereClauses,
        ...processDateCondition('startDate', 'dateRange', query.dateRange),
      };
    }

    return AppointmentsModel.findAll({
      where: appointmentWhereClauses,
    });
  }

  searchEvents(identity: IIdentity, query: CalendarSearchInput, queryType: EntryType): Promise<EventModel[]> {
    if (!queryType.hasType(CalendarType.EVENT)) {
      return Promise.resolve([]);
    }
    let eventWhereClauses: WhereOptions<AppointmentsModel> = {
      clinicId: { [Op.eq]: identity.clinicId },
      deletedBy: { [Op.is]: null },
    };

    if (query.staffId) {
      eventWhereClauses = {
        ...eventWhereClauses,
        ...processIdCondition('staffId', 'staffId', query.staffId),
      };
    }

    if (query.dateRange) {
      eventWhereClauses = {
        ...eventWhereClauses,
        ...processDateCondition('date', 'dateRange', query.dateRange),
      };
    }

    return EventModel.findAll({
      where: eventWhereClauses,
    });
  }

  searchAvailabilities(
    identity: IIdentity,
    query: CalendarSearchInput,
    queryType: EntryType,
  ): Promise<AvailabilityModel[]> {
    if (!queryType.hasType(CalendarType.AVAILABILITY)) {
      return Promise.resolve([]);
    }
    let availabilityWhereClauses: WhereOptions<AvailabilityModelAttributes> = {
      clinicId: { [Op.eq]: identity.clinicId },
      isOccupied: { [Op.eq]: false },
      deletedBy: { [Op.is]: null },
    };

    if (query.staffId) {
      availabilityWhereClauses = {
        ...availabilityWhereClauses,
        ...processIdCondition('staffId', 'staffId', query.staffId),
      };
    }

    if (query.dateRange) {
      availabilityWhereClauses = {
        ...availabilityWhereClauses,
        ...processDateCondition('date', 'dateRange', query.dateRange),
      };
    }

    return AvailabilityModel.findAll({
      where: availabilityWhereClauses,
    });
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
    const startOfDay = DateTime.fromJSDate(filter.eq).toSQLDate();
    const endOfDay = `${startOfDay} 23:59:59`;
    return { [columnName]: { [Op.between]: [startOfDay, endOfDay] } };
  }

  if (filter.between) {
    const startOfDate1 = DateTime.fromJSDate(filter.between[0]).toSQLDate();
    const endOfDate2 = `${DateTime.fromJSDate(filter.between[1]).toSQLDate()} 23:59:59`; //Append end of day time
    return {
      [columnName]: {
        [Op.between]: [startOfDate1, endOfDate2],
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

function availabilityAsCalendarEvent(model: AvailabilityModelAttributes): CalendarAvailability {
  return {
    ...model,
    entryType: CalendarType.AVAILABILITY,
    __typename: 'CalendarAvailability',
  } as CalendarAvailability;
}

function appointmentAsCalendarEvent(model: AppointmentsModelAttributes): CalendarAvailability {
  return {
    ...model,
    entryType: CalendarType.APPOINTMENT,
    __typename: 'CalendarAppointment',
  } as CalendarAvailability;
}

function eventAsCalendarEvent(model: EventModelAttributes): CalendarAvailability {
  return {
    ...model,
    entryType: CalendarType.EVENT,
    __typename: 'CalendarEvent',
  } as CalendarAvailability;
}

class EntryType {
  private entryTypes: string[];
  private all = false;
  constructor(entryTypeQuery: FilterStringInputDto) {
    if (entryTypeQuery?.eq) {
      this.entryTypes = [entryTypeQuery?.eq];
    } else if (entryTypeQuery?.in) {
      this.entryTypes = entryTypeQuery?.in;
    } else {
      this.entryTypes = [];
      this.all = true;
    }
  }

  hasType(entryName: string): boolean {
    return this.all || this.entryTypes.includes(entryName);
  }
}
