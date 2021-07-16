import { TracingModule } from '@narando/nest-xray';
import { Module } from '@nestjs/common';
import { EVENTS_REPOSITORY } from '../../common/constants';
import { DatabaseModule } from '../database/database.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventModel } from './models';

const repoProvider = {
  provide: EVENTS_REPOSITORY,
  useValue: EventModel,
};

@Module({
  imports: [DatabaseModule, TracingModule.forRoot({ serviceName: 'events' })],
  controllers: [EventsController],
  providers: [EventsService, repoProvider],
  exports: [EventsService],
})
export class EventsModule {}
