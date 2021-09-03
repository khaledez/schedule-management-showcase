import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityController } from 'modules/availability/availability.controller';
import { AvailabilityService } from 'modules/availability/availability.service';
import { availabilityProviders } from 'modules/availability/availability.provider';
import { DatabaseModule } from 'modules/database/database.module';
import { EventsModule } from 'modules/events/events.module';
import { LookupsModule } from 'modules/lookups/lookups.module';
import { ConfigurationModule } from 'modules/config/config.module';
import { AppointmentsService } from '../../appointments/appointments.service';

describe('AvailabilityController', () => {
  let controller: AvailabilityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, EventsModule, LookupsModule, ConfigurationModule],
      controllers: [AvailabilityController],
      providers: [AvailabilityService, ...availabilityProviders, { provide: AppointmentsService, useValue: {} }],
    }).compile();

    controller = module.get<AvailabilityController>(AvailabilityController);
  });

  test('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
