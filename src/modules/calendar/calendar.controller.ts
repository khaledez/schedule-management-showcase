import { Identity, IIdentity } from '@monmedx/monmedx-common';
import { Body, Controller, Post } from '@nestjs/common';
import { CalendarSearchBodyDto } from './calendar.dtos';
import { CalendarSearchResult } from './calendar.interface';
import { CalendarService } from './calendar.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarSvc: CalendarService) {}

  @Post('search')
  search(@Identity() identity: IIdentity, @Body() searchQuery: CalendarSearchBodyDto): Promise<CalendarSearchResult> {
    return this.calendarSvc.search(identity, searchQuery.filter);
  }
}
