import { FilterStringInputDto, IIdentity } from '@dashps/monmedx-common';
import { Injectable, Logger } from '@nestjs/common';
import { CalendarType } from 'common/enums';
import { processFilterDatesInput, processFilterIdsInput } from 'common/filters/basic-filter-to-query';
import { AvailabilityModelAttributes } from 'modules/availability/models/availability.interfaces';
import { LookupsService } from 'modules/lookups/lookups.service';
import { AppointmentStatusLookupsModel } from 'modules/lookups/models/appointment-status.model';
import { AppointmentTypesLookupsModel } from 'modules/lookups/models/appointment-types.model';
import { AppointmentVisitModeLookupModel } from 'modules/lookups/models/appointment-visit-mode.model';
import { Op, WhereOptions } from 'sequelize';
import { AppointmentsModel, AppointmentsModelAttributes } from '../appointments/appointments.model';
import { AvailabilityModel } from '../availability/models/availability.model';
import { EventModel, EventModelAttributes } from '../events/models';
import {
  CalendarAppointment,
  CalendarAvailability,
  CalendarEvent,
  CalendarSearchInput,
  CalendarSearchResult,
} from './calendar.interface';

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

    // TODO fix these queries .. making queries in such way is wrong,
    // as it will return appointments with availability as two entries
    const [appointments, events, availabilities] = await Promise.all([
      this.searchAppointments(identity, query, queryType),
      this.searchEvents(identity, query, queryType),
      this.searchAvailabilities(identity, query, queryType),
    ]);

    const provisionalStatusId = await this.lookupService.getProvisionalAppointmentStatusId(identity);
    const entries = [];
    appointments.forEach((appt) =>
      entries.push(appointmentAsCalendarEvent(appt, appt.appointmentStatusId === provisionalStatusId)),
    );
    events.map((event) => event.get({ plain: true })).forEach((event) => entries.push(eventAsCalendarEvent(event)));
    availabilities
      .map((availability) => availability.get({ plain: true }))
      .forEach((availability) => entries.push(availabilityAsCalendarEvent(availability)));

    entries.sort((a, b) => a.startDate - b.startDate);
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
    const provisionalStatusId = await this.lookupService.getProvisionalAppointmentStatusId(identity);
    let appointmentWhereClauses: WhereOptions<AppointmentsModel> = {
      clinicId: { [Op.eq]: identity.clinicId },
      appointmentStatusId: { [Op.ne]: provisionalStatusId },
      deletedBy: { [Op.is]: null },
    };

    if (query.staffId) {
      appointmentWhereClauses = {
        ...appointmentWhereClauses,
        ...processFilterIdsInput('staffId', 'staffId', query.staffId),
      };
    }

    if (query.dateRange) {
      appointmentWhereClauses = {
        ...appointmentWhereClauses,
        ...processFilterDatesInput('startDate', 'dateRange', query.dateRange),
      };
    }

    const appointments = await AppointmentsModel.findAll({
      where: appointmentWhereClauses,
      include: [AppointmentStatusLookupsModel, AppointmentVisitModeLookupModel, AppointmentTypesLookupsModel],
    });

    const actions = await this.lookupService.findAppointmentsActions(
      appointments.map((appt) => appt.appointmentStatusId),
    );
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
      clinicId: { [Op.eq]: identity.clinicId },
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
        ...processFilterDatesInput('date', 'dateRange', query.dateRange),
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
        ...processFilterIdsInput('staffId', 'staffId', query.staffId),
      };
    }

    if (query.dateRange) {
      availabilityWhereClauses = {
        ...availabilityWhereClauses,
        ...processFilterDatesInput('date', 'dateRange', query.dateRange),
      };
    }

    return AvailabilityModel.findAll({
      where: availabilityWhereClauses,
      include: [AppointmentTypesLookupsModel],
    });
  }
}

function availabilityAsCalendarEvent(model: AvailabilityModelAttributes): CalendarAvailability {
  return {
    ...model,
    entryType: CalendarType.AVAILABILITY,
    __typename: 'CalendarAvailability',
  } as CalendarAvailability;
}

function appointmentAsCalendarEvent(model: AppointmentsModelAttributes, isProvisional: boolean): CalendarAppointment {
  return {
    ...model,
    entryType: CalendarType.APPOINTMENT,
    provisionalAppointment: isProvisional,
    __typename: 'CalendarAppointment',
  } as CalendarAppointment;
}

function eventAsCalendarEvent(model: EventModelAttributes): CalendarEvent {
  return {
    ...model,
    entryType: CalendarType.EVENT,
    __typename: 'CalendarEvent',
  };
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
