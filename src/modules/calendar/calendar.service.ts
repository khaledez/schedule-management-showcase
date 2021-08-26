import { FilterStringInputDto, IIdentity } from '@dashps/monmedx-common';
import { Injectable, Logger } from '@nestjs/common';
import { CalendarType } from 'common/enums';
import { processFilterDatesInput, processFilterIdsInput } from 'common/filters/basic-filter-to-query';
import { AvailabilityModelAttributes } from 'modules/availability/models/availability.interfaces';
import { LookupsService } from 'modules/lookups/lookups.service';
import { AppointmentCancelRescheduleReasonLookupModel } from 'modules/lookups/models/appointment-cancel-reschedule-reason.model';
import { AppointmentStatusLookupsModel } from 'modules/lookups/models/appointment-status.model';
import { AppointmentTypesLookupsModel } from 'modules/lookups/models/appointment-types.model';
import { AppointmentVisitModeLookupModel } from 'modules/lookups/models/appointment-visit-mode.model';
import { Op, WhereOptions } from 'sequelize';
import { AppointmentsModel, AppointmentsModelAttributes } from '../appointments/appointments.model';
import { AvailabilityModel } from '../availability/models/availability.model';
import { EventModel } from '../events/models';
import { CalendarSearchInput, CalendarSearchResult } from './calendar.interface';

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
      include: [
        AppointmentStatusLookupsModel,
        AppointmentVisitModeLookupModel,
        AppointmentTypesLookupsModel,
        AppointmentCancelRescheduleReasonLookupModel,
      ],
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
        ...processFilterDatesInput('startDate', 'dateRange', query.dateRange),
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
