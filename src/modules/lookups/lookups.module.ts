import { CacheModule, Module } from '@nestjs/common';
import { LookupsController } from './lookups.controller';
import { lookupsProviders } from './lookups.provider';
import { LookupsService } from './lookups.service';

@Module({
  imports: [CacheModule.register({ ttl: 60 * 60 /* 1 hour */ })],
  controllers: [LookupsController],
  providers: [LookupsService, ...lookupsProviders],
  exports: [LookupsService],
})
export class LookupsModule {}
