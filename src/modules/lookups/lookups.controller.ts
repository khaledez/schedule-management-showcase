import { Controller, Get } from '@nestjs/common';
import { LookupsService } from './lookups.service';
import { DurationMinutesLookupsModel } from './models/duration-minutes.model';
import { TimeGroupsLookupsModel } from './models/time-groups.model';
import { AppointmentActionsLookupsModel } from './models/appointment-actions.model';
import { AppointmentStatusLookupsModel } from './models/appointment-status.model';
import { AppointmentTypesLookupsModel } from './models/appointment-types.model';
import { Identity } from '@mon-medic/common';
import { IdentityDto } from 'src/common/dtos/identity.dto';

@Controller('lookups')
export class LookupsController {
  constructor(private readonly lookupsService: LookupsService) {}

  @Get('/duration-minutes')
  public findDurationMinutes(@Identity() identity: IdentityDto): Promise<DurationMinutesLookupsModel[]> {
    return this.lookupsService.findAllDurationMinutesLookups(identity);
  }

  @Get('/time-groups')
  public findTimeGroups(@Identity() identity: IdentityDto): Promise<TimeGroupsLookupsModel[]> {
    return this.lookupsService.findAllTimeGroupsLookups(identity);
  }

  @Get('/appointment-actions')
  public findAppointmentActions(@Identity() identity: IdentityDto): Promise<AppointmentActionsLookupsModel[]> {
    return this.lookupsService.findAllAppointmentActionsLookups(identity);
  }

  @Get('/appointment-status')
  public findAppointmentStatus(@Identity() identity: IdentityDto): Promise<AppointmentStatusLookupsModel[]> {
    return this.lookupsService.findAllAppointmentStatusLookups(identity);
  }
  @Get('/appointment-types')
  public findAppointmentTypes(@Identity() identity: IdentityDto): Promise<AppointmentTypesLookupsModel[]> {
    return this.lookupsService.findAllAppointmentTypesLookups(identity);
  }
}
