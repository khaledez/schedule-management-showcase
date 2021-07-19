import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityController } from 'modules/availability/availability.controller';
import { AvailabilityService } from 'modules/availability/availability.service';

const availabilityArray = [];

describe('AvailabilityController', () => {
  let controller: AvailabilityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        {
          provide: AvailabilityService,
          useValue: {
            finalAll: jest.fn(() => [availabilityArray]),
          },
        },
      ],
    }).compile();

    controller = module.get<AvailabilityController>(AvailabilityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
