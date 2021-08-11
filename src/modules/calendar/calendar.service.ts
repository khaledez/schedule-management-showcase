import { FilterDateInputDto, FilterIdsInputDto, IIdentity } from '@dashps/monmedx-common';
import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AvailabilityModelAttributes } from 'modules/availability/models/availability.interfaces';
import { LookupsService } from 'modules/lookups/lookups.service';
import { Includeable, Op, WhereAttributeHash, WhereOptions } from 'sequelize';
import { BAD_REQUEST } from '../../common/constants';
import { AppointmentsModel } from '../appointments/appointments.model';
import { AvailabilityModel } from '../availability/models/availability.model';
import { EventModel } from '../events/models';
import {
  CalendarAppointment,
  CalendarAvailability,
  CalendarEvent,
  CalendarSearchInput,
  CalendarSearchResult,
} from './calendar.interface';

const ALL = 'ALL';

@Injectable()
export class CalendarService {
  constructor(private readonly lookupService: LookupsService) {}

  // eslint-disable-next-line complexity
  async search(identity: IIdentity, query: CalendarSearchInput): Promise<CalendarSearchResult> {
    const queryType = query.entryType?.eq ? query.entryType?.eq : ALL;

    let availabilityConditions: WhereOptions<AvailabilityModel> = {
      clinicId: { [Op.eq]: identity.clinicId },
      deletedBy: { [Op.is]: null },
    };

    if (query.staffId) {
      availabilityConditions = {
        ...availabilityConditions,
        ...processIdCondition('staffId', 'staffId', query.staffId),
      };
    }

    if (query.dateRange) {
      availabilityConditions = {
        ...availabilityConditions,
        ...processDateCondition('date', 'dateRange', query.dateRange),
      };
    }

    const toInclude: Includeable[] = [];
    if (queryType === 'EVENT' || queryType === ALL) {
      toInclude.push({
        model: EventModel,
        required: queryType === 'EVENT',
      });
    }

    if (queryType === 'APPOINTMENT' || queryType === ALL) {
      toInclude.push({
        model: AppointmentsModel,
        required: queryType === 'APPOINTMENT',
      });
    }

    if (queryType === 'AVAILABILITY') {
      availabilityConditions = { ...availabilityConditions, ...availabilityFilters(query) };
      if (query.availabilityFilter?.withAppointment) {
        toInclude.push({ model: AppointmentsModel, required: true });
      }
    }

    // execute now
    const result = await AvailabilityModel.findAll({ where: availabilityConditions, include: toInclude });

    const provisionalStatusId = await this.lookupService.getProvisionalAppointmentStatusId(identity);
    const entries = result
      .map((el) => el.get({ plain: true }))
      .filter((model) => {
        // filter out provisional appointments.. I couldn't find a type-safe way to do it in the query
        if (model.appointment) {
          return model.appointment.appointmentStatusId !== provisionalStatusId;
        }
        return true;
      })
      .map((model) => {
        switch (queryType) {
          case 'AVAILABILITY':
            return availabilityAsCalendarEvent(model);
          case 'EVENT':
            return availabilityToEvent(model);
          case 'APPOINTMENT':
            return availabilityToAppointment(model);
          default:
            if (model.appointment) {
              return availabilityToAppointment(model);
            } else if (model.event) {
              return availabilityToEvent(model);
            }
            return availabilityAsCalendarEvent(model);
        }
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

  return availConditions;
}

function availabilityAsCalendarEvent(model: AvailabilityModelAttributes): CalendarAvailability {
  return {
    ...model,
    entryType: 'AVAILABILITY',
    __typename: 'CalendarAvailability',
  } as CalendarAvailability;
}

function availabilityToAppointment(model: AvailabilityModelAttributes): CalendarAppointment {
  const appt = model.appointment;
  return {
    entryType: 'APPOINTMENT',
    __typename: 'CalendarAppointment',
    startDate: appt.startDate,
    provisionalDate: appt.provisionalDate,
    canceledAt: appt.canceledAt,
    canceledBy: appt.canceledBy,
    patientId: appt.patientId,
    endDate: appt.endDate,
    staffId: appt.staffId,
    availabilityId: appt.availabilityId,
    ...model.appointment,
  } as CalendarAppointment;
}

function availabilityToEvent(model: AvailabilityModelAttributes): CalendarEvent {
  return {
    ...model.event,
    entryType: 'EVENT',
    __typename: 'CalendarEvent',
    startDate: model.startDate,
  } as CalendarEvent;
}
