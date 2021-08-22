import { Test, TestingModule } from '@nestjs/testing';
import { LookupsController } from 'modules/lookups/lookups.controller';
import { LookupsModule } from '../lookups.module';

describe('LookupsController', () => {
  let controller: LookupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LookupsModule],
    }).compile();

    controller = module.get<LookupsController>(LookupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
