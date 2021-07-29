import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EventsModule } from '../events/events.module';
import { AvailabilityController } from './availability.controller';
import { availabilityProviders } from './availability.provider';
import { AvailabilityService } from './availability.service';
import { LookupsModule } from 'modules/lookups/lookups.module';

@Module({
  imports: [DatabaseModule, EventsModule, LookupsModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, ...availabilityProviders],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
