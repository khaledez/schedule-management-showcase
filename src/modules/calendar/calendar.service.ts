import { FilterStringInputDto, IIdentity } from '@monmedx/monmedx-common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CalendarType } from 'common/enums';
import { processFilterIdsInput } from 'common/filters/basic-filter-to-query';
import { CalendarEntry } from 'common/interfaces/calendar-entry';
import { DateTime } from 'luxon';
import { AvailabilityModelAttributes } from 'modules/availability/models/availability.interfaces';
import { LookupsService } from 'modules/lookups/lookups.service';
import { AppointmentCancelRescheduleReasonLookupModel } from 'modules/lookups/models/appointment-cancel-reschedule-reason.model';
import { AppointmentStatusLookupsModel } from 'modules/lookups/models/appointment-status.model';
import { AppointmentTypesLookupsModel } from 'modules/lookups/models/appointment-types.model';
import { AppointmentVisitModeLookupModel } from 'modules/lookups/models/appointment-visit-mode.model';
import { Op, WhereOptions } from 'sequelize';
import { APPOINTMENTS_REPOSITORY, AVAILABILITY_REPOSITORY, EVENTS_REPOSITORY } from '../../common/constants';
import { AppointmentsModel, AppointmentsModelAttributes } from '../appointments/appointments.model';
import { AvailabilityModel } from '../availability/models/availability.model';
import { EventModel } from '../events/models';
import { CalendarSearchInput, CalendarSearchResult, DayCalendarEntry } from './calendar.interface';
import { WhereClauseBuilder } from '../../common/helpers/where-clause-builder';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly lookupService: LookupsService,
    @Inject(APPOINTMENTS_REPOSITORY)
    private readonly appointmentsRepository: typeof AppointmentsModel,
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: typeof AvailabilityModel,
    @Inject(EVENTS_REPOSITORY)
    private readonly eventRepository: typeof EventModel,
  ) {}

  async search(identity: IIdentity, query: CalendarSearchInput): Promise<CalendarSearchResult> {
    this.logger.debug({
      method: 'CalenderService/search',
      query,
    });

    const queryType = new EntryType(query.entryType);

    const [appointments, events, availabilities] = await Promise.all([
      this.searchAppointments(identity, query, queryType),
      this.searchEvents(identity, query, queryType),
      this.searchAvailabilities(identity, query, queryType),
    ]);

    const entries = [];
    appointments.forEach((appt) => entries.push(appt));
    events.map((event) => event.get({ plain: true })).forEach((event) => entries.push(event));
    availabilities
      .map((availability) => availability.get({ plain: true }))
      .forEach((availability) => entries.push(availability));

    entries.sort((a, b) => a.startDate - b.startDate);

    if (query.maxDayCount) {
      // group by day
      const groupedEntries: { [key: string]: Partial<DayCalendarEntry> } = entries.reduce(
        (acc: { [key: string]: { total: number; entries: CalendarEntry[] } }, entry) => {
          const localDate = DateTime.fromJSDate(entry.startDate).toISODate();
          if (acc[localDate]) {
            acc[localDate].total++;
            if (query.maxDayCount >= acc[localDate].total) {
              acc[localDate].entries.push(entry);
            }
          } else {
            acc[localDate] = { total: 1, entries: [entry] };
          }

          return acc;
        },
        {},
      );

      return {
        entries: Object.entries(groupedEntries).map(
          ([key, val]) =>
            ({
              date: key,
              ...val,
              __typename: 'DayCalendarEntry',
            } as DayCalendarEntry),
        ),
      };
    }

    return { entries };
  }

  async searchAppointments(
    identity: IIdentity,
    query: CalendarSearchInput,
    queryType: EntryType,
  ): Promise<AppointmentsModelAttributes[]> {
    if (!queryType.hasType(CalendarType.APPOINTMENT)) {
      return [];
    }
    let appointmentWhereClauses: WhereOptions<AppointmentsModel> = {
      clinicId: identity.clinicId,

      deletedBy: { [Op.is]: null },
    };

    if (query.staffId) {
      appointmentWhereClauses = {
        ...appointmentWhereClauses,
        ...processFilterIdsInput('staffId', 'staffId', query.staffId),
      };
    }

    if (query.appointmentTypeId) {
      appointmentWhereClauses = {
        ...appointmentWhereClauses,
        ...processFilterIdsInput('appointmentTypeId', 'appointmentTypeId', query.appointmentTypeId),
      };
    }

    const provisionalStatusId = await this.lookupService.getProvisionalAppointmentStatusId(identity);
    if (query.appointmentStatusId) {
      appointmentWhereClauses = {
        ...appointmentWhereClauses,
        ...processFilterIdsInput('appointmentStatusId', 'appointmentStatusId', query.appointmentStatusId),
      };
    }

    if (query.dateRange) {
      appointmentWhereClauses = {
        ...appointmentWhereClauses,
        ...WhereClauseBuilder.getDateWhereClause('startDate', 'dateRange', query.dateRange),
      };
    }

    if (query.dateTimeRange) {
      appointmentWhereClauses = {
        ...appointmentWhereClauses,
        ...WhereClauseBuilder.getDateTimeWhereClause('startDate', 'dateTimeRange', query.dateTimeRange),
      };
    }

    const appointments = await this.appointmentsRepository.findAll({
      where: appointmentWhereClauses,
      include: [
        AppointmentStatusLookupsModel,
        AppointmentVisitModeLookupModel,
        AppointmentTypesLookupsModel,
        AppointmentCancelRescheduleReasonLookupModel,
      ],
    });

    const actions = await this.lookupService.findAppointmentsActions(appointments);
    this.logger.debug({
      title: 'appointment actions',
      actions,
    });

    const statuses = await this.lookupService.getActiveAppointmentsStatuses(identity);
    return appointments
      .map((appt) => appt.get())
      .map((appt, index) => {
        return {
          ...appt,
          active: statuses.includes(appt.appointmentStatusId),
          primaryAction: actions[index].nextAction,
          secondaryActions: actions[index].secondaryActions,
          provisionalAppointment: appt.appointmentStatusId === provisionalStatusId,
        };
      });
  }

  searchEvents(identity: IIdentity, query: CalendarSearchInput, queryType: EntryType): Promise<EventModel[]> {
    if (!queryType.hasType(CalendarType.EVENT)) {
      return Promise.resolve([]);
    }
    let eventWhereClauses: WhereOptions<AppointmentsModel> = {
      clinicId: identity.clinicId,
      deletedBy: { [Op.is]: null },
    };

    if (query.staffId) {
      eventWhereClauses = {
        ...eventWhereClauses,
        ...processFilterIdsInput('staffId', 'staffId', query.staffId),
      };
    }

    if (query.dateRange) {
      eventWhereClauses = {
        ...eventWhereClauses,
        ...WhereClauseBuilder.getDateWhereClause('startDate', 'dateRange', query.dateRange),
      };
    }

    if (query.dateTimeRange) {
      eventWhereClauses = {
        ...eventWhereClauses,
        ...WhereClauseBuilder.getDateTimeWhereClause('startDate', 'dateTimeRange', query.dateTimeRange),
      };
    }

    return this.eventRepository.findAll({
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
      clinicId: identity.clinicId,
      isOccupied: false,
      deletedBy: { [Op.is]: null },
    };

    if (query.staffId) {
      availabilityWhereClauses = {
        ...availabilityWhereClauses,
        ...processFilterIdsInput('staffId', 'staffId', query.staffId),
      };
    }

    if (query.appointmentTypeId) {
      availabilityWhereClauses = {
        ...availabilityWhereClauses,
        ...processFilterIdsInput('appointmentTypeId', 'appointmentTypeId', query.appointmentTypeId),
      };
    }

    if (query.dateRange) {
      availabilityWhereClauses = {
        ...availabilityWhereClauses,
        ...WhereClauseBuilder.getDateWhereClause(AvailabilityModel.DATE_COLUMN, 'dateRange', query.dateRange),
      };
    }

    if (query.dateTimeRange) {
      availabilityWhereClauses = {
        ...availabilityWhereClauses,
        ...WhereClauseBuilder.getDateTimeWhereClause(
          AvailabilityModel.DATE_COLUMN,
          'dateTimeRange',
          query.dateTimeRange,
        ),
      };
    }

    return this.availabilityRepository.findAll({
      where: availabilityWhereClauses,
      include: [AppointmentTypesLookupsModel],
    });
  }
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
