import { Module } from '@nestjs/common';
import { LookupsModule } from 'modules/lookups/lookups.module';
import { EVENTS_REPOSITORY } from '../../common/constants';
import { DatabaseModule } from '../database/database.module';
import { EventsModule } from '../events/events.module';
import { EventModel } from '../events/models';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { AppointmentsModule } from '../appointments/appointments.module';
import { AvailabilityModule } from '../availability/availability.module';

const repoProviders = [
  {
    provide: EVENTS_REPOSITORY,
    useValue: EventModel,
  },
];

@Module({
  imports: [DatabaseModule, EventsModule, LookupsModule, AppointmentsModule, AvailabilityModule],
  controllers: [CalendarController],
  providers: [CalendarService, ...repoProviders],
  exports: [CalendarService],
})
export class CalendarModule {}
