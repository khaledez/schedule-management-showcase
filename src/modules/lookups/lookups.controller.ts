import { Identity, IIdentity } from '@monmedx/monmedx-common';
import { Controller, Get } from '@nestjs/common';
import { LookupsService } from './lookups.service';
import { AppointmentActionsLookupsModel } from './models/appointment-actions.model';
import { AppointmentStatusLookupsModel } from './models/appointment-status.model';
import { AppointmentTypesLookupsModel } from './models/appointment-types.model';
import { DurationMinutesLookupsModel } from './models/duration-minutes.model';
import { TimeGroupsLookupsModel } from './models/time-groups.model';

@Controller('lookups')
export class LookupsController {
  constructor(private readonly lookupsService: LookupsService) {}

  @Get('/duration-minutes')
  public findDurationMinutes(@Identity() identity: IIdentity): Promise<DurationMinutesLookupsModel[]> {
    return this.lookupsService.findAllDurationMinutesLookups(identity);
  }

  @Get('/time-groups')
  public findTimeGroups(@Identity() identity: IIdentity): Promise<TimeGroupsLookupsModel[]> {
    return this.lookupsService.findAllTimeGroupsLookups(identity);
  }

  @Get('/appointment-actions')
  public findAppointmentActions(@Identity() identity: IIdentity): Promise<AppointmentActionsLookupsModel[]> {
    return this.lookupsService.findAllAppointmentActionsLookups(identity);
  }

  @Get('/appointment-status')
  public findAppointmentStatus(@Identity() identity: IIdentity): Promise<AppointmentStatusLookupsModel[]> {
    return this.lookupsService.findAllAppointmentStatusLookups(identity);
  }
  @Get('/appointment-types')
  public findAppointmentTypes(@Identity() identity: IIdentity): Promise<AppointmentTypesLookupsModel[]> {
    return this.lookupsService.findAllAppointmentTypesLookups(identity);
  }

  @Get('/appointment-visit-modes')
  public findAppointmentVisitModes(@Identity() identity: IIdentity) {
    return this.lookupsService.findAllAppointmentVisitModes(identity);
  }

  /**
   * @deprecated use {@link getCancelReasons} and {@link getRescheduleReasons} instead
   */
  @Get('/cancel-reschedule-reason')
  public findAppointmentCancelRescheduleReasons(@Identity() identity: IIdentity) {
    return this.lookupsService.findAllAppointmentCancelRescheduleReasons(identity);
  }

  @Get('/cancel-reasons')
  public getCancelReasons(@Identity() identity: IIdentity) {
    return this.lookupsService.getCancelReasons(identity);
  }

  @Get('/reschedule-reasons')
  public getRescheduleReasons(@Identity() identity: IIdentity) {
    return this.lookupsService.getRescheduleReasons(identity);
  }
}
