import { Module } from '@nestjs/common';
import { LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';
import { lookupsProviders } from './lookups.provider';

@Module({
  controllers: [LookupsController],
  providers: [LookupsService, ...lookupsProviders],
})
export class LookupsModule {}
