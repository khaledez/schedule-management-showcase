import { Module } from '@nestjs/common';
import { CLINIC_SETTINGS_REPOSITORY } from 'common/constants';
import { DatabaseModule } from 'modules/database/database.module';
import { ClinicSettingController } from './clinic-settings.controller';
import { ClinicSettingsModel } from './clinic-settings.model';
import { ClinicSettingsService } from './clinic-settings.service';

const repoProviders = [
  {
    provide: CLINIC_SETTINGS_REPOSITORY,
    useValue: ClinicSettingsModel,
  },
];

@Module({
  imports: [DatabaseModule],
  providers: [ClinicSettingsService, ...repoProviders],
  controllers: [ClinicSettingController],
  exports: [ClinicSettingsService],
})
export class ClinicSettingsModule {}
