import { TracingModule } from '@narando/nest-xray';
import { Module } from '@nestjs/common';
import { EVENTS_REPOSITORY } from 'src/common/constants';
import { DatabaseModule } from '../database/database.module';
import { EventModel } from '../events/models';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

const repoProviders = [
  {
    provide: EVENTS_REPOSITORY,
    useValue: EventModel,
  },
];

@Module({
  imports: [DatabaseModule, TracingModule.forRoot({ serviceName: 'events' })],
  controllers: [CalendarController],
  providers: [CalendarService, ...repoProviders],
  exports: [CalendarService],
})
export class CalendarModule {}
