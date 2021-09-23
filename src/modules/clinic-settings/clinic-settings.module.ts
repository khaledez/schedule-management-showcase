import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { CLINIC_SETTINGS_REPOSITORY } from 'common/constants';
import { DatabaseModule } from 'modules/database/database.module';
import { ClinicSettingsService } from './clinic-settings.service';
import { ClinicSettingsModel } from './clinic-settings.model';

const repoProviders = [
  {
    provide: CLINIC_SETTINGS_REPOSITORY,
    useValue: ClinicSettingsModel,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [ClinicSettingsService, ...repoProviders],
  exports: [ClinicSettingsService],
})
export class ClinicSettingsModule {}
