import { Controller, Get, Headers } from '@nestjs/common';
import { LookupsService } from './lookups.service';
import { DurationMinutesLookupsModel } from './models/duration-minutes.model';
import { TimeGroupsLookupsModel } from './models/time-groups.model';
import { AppointmentActionsLookupsModel } from './models/appointment-actions.model';
import { AppointmentStatusLookupsModel } from './models/appointment-status.model';
import { AppointmentTypesLookupsModel } from './models/appointment-types.model';

@Controller('lookups')
export class LookupsController {
  constructor(private readonly lookupsService: LookupsService) {}

  @Get('/duration-minutes')
  public findDurationMinutes(
    @Headers() headers?: Headers,
  ): Promise<DurationMinutesLookupsModel[]> {
    const clinicId: string = headers['x-mmx-clinic-id'];
    return this.lookupsService.findAllDurationMinutesLookups(Number(clinicId));
  }

  @Get('/time-groups')
  public findTimeGroups(
    @Headers() headers?: Headers,
  ): Promise<TimeGroupsLookupsModel[]> {
    const clinicId: string = headers['x-mmx-clinic-id'];
    return this.lookupsService.findAllTimeGroupsLookups(Number(clinicId));
  }

  @Get('/appointment-actions')
  public findAppointmentActions(
    @Headers() headers?: Headers,
  ): Promise<AppointmentActionsLookupsModel[]> {
    const clinicId: string = headers['x-mmx-clinic-id'];
    return this.lookupsService.findAllAppointmentActionsLookups(
      Number(clinicId),
    );
  }

  @Get('/appointment-status')
  public findAppointmentStatus(
    @Headers() headers?: Headers,
  ): Promise<AppointmentStatusLookupsModel[]> {
    const clinicId: string = headers['x-mmx-clinic-id'];
    return this.lookupsService.findAllAppointmentTypesLookups(Number(clinicId));
  }
  @Get('/appointment-types')
  public findAppointmentTypes(
    @Headers() headers?: Headers,
  ): Promise<AppointmentTypesLookupsModel[]> {
    const clinicId: string = headers['x-mmx-clinic-id'];
    return this.lookupsService.findAllAppointmentStatusLookups(
      Number(clinicId),
    );
  }
}
