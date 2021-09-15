import { Public } from '@monmedx/monmedx-common';
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

  @Public()
  @Get('/duration-minutes')
  public findDurationMinutes(): Promise<DurationMinutesLookupsModel[]> {
    return this.lookupsService.findAllDurationMinutesLookups();
  }

  @Public()
  @Get('/time-groups')
  public findTimeGroups(): Promise<TimeGroupsLookupsModel[]> {
    return this.lookupsService.findAllTimeGroupsLookups();
  }

  @Public()
  @Get('/appointment-actions')
  public findAppointmentActions(): Promise<AppointmentActionsLookupsModel[]> {
    return this.lookupsService.findAllAppointmentActionsLookups();
  }

  @Public()
  @Get('/appointment-status')
  public findAppointmentStatus(): Promise<AppointmentStatusLookupsModel[]> {
    return this.lookupsService.findAllAppointmentStatusLookups();
  }

  @Public()
  @Get('/appointment-types')
  public findAppointmentTypes(): Promise<AppointmentTypesLookupsModel[]> {
    return this.lookupsService.findAllAppointmentTypesLookups();
  }

  @Public()
  @Get('/appointment-visit-modes')
  public findAppointmentVisitModes() {
    return this.lookupsService.findAllAppointmentVisitModes();
  }

  /**
   * @deprecated use {@link getCancelReasons} and {@link getRescheduleReasons} instead
   */
  @Public()
  @Get('/cancel-reschedule-reason')
  public findAppointmentCancelRescheduleReasons() {
    return this.lookupsService.findAllAppointmentCancelRescheduleReasons();
  }

  @Public()
  @Get('/cancel-reasons')
  public getCancelReasons() {
    return this.lookupsService.getCancelReasons();
  }

  @Public()
  @Get('/reschedule-reasons')
  public getRescheduleReasons() {
    return this.lookupsService.getRescheduleReasons();
  }

  @Public()
  @Get('/appointment-request-types')
  public getAppintmentRequestTypes() {
    return this.lookupsService.findAllAppointmentRequestTypesLookups();
  }

  @Public()
  @Get('/appointment-request-status')
  public getAppintmentRequestStatus() {
    return this.lookupsService.findAllAppointmentRequestStatusLookups();
  }
}
