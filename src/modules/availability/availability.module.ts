import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { availabilityProviders } from './availability.provider';
import { DatabaseModule } from '../database/database.module';
import { TracingModule } from '@narando/nest-xray';

@Module({
  imports: [DatabaseModule, TracingModule.forRoot({ serviceName: 'availability' })],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, ...availabilityProviders],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
