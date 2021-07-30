import { Test, TestingModule } from '@nestjs/testing';
import { LookupsController } from 'modules/lookups/lookups.controller';
import { lookupsProviders } from 'modules/lookups/lookups.provider';
import { LookupsService } from 'modules/lookups/lookups.service';

describe('LookupsController', () => {
  let controller: LookupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LookupsService, ...lookupsProviders],
      controllers: [LookupsController],
    }).compile();

    controller = module.get<LookupsController>(LookupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});