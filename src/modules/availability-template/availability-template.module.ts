import { Module } from '@nestjs/common';
import { AVAILABILITY_SLOT_REPOSITORY, AVAILABILITY_TEMPLATE_REPOSITORY } from 'common/constants';
import { DatabaseModule } from 'modules/database/database.module';
import { LookupsModule } from 'modules/lookups/lookups.module';
import { AvailabilityTemplateController } from './availability-template.controller';
import { AvailabilityTemplateService } from './availability-template.service';
import { AvailabilityTemplateSlotModel } from './model/availability-template-slot.model ';
import { AvailabilityTemplateModel } from './model/availability-template.model';

const repoProviders = [
  { provide: AVAILABILITY_TEMPLATE_REPOSITORY, useValue: AvailabilityTemplateModel },
  { provide: AVAILABILITY_SLOT_REPOSITORY, useValue: AvailabilityTemplateSlotModel },
];
@Module({
  imports: [DatabaseModule, LookupsModule],
  controllers: [AvailabilityTemplateController],
  providers: [AvailabilityTemplateService, ...repoProviders],
})
export class AvailabilityTemplateModule {}
