import { IUserPrincipal, UserPrincipal } from '@monmedx/monmedx-common';
import { Controller, Get } from '@nestjs/common';
import { ClinicSettingsService } from './clinic-settings.service';

@Controller('clinic-settings')
export class ClinicSettingController {
  constructor(private readonly clinicSettingsService: ClinicSettingsService) {}

  @Get()
  clinicSetting(@UserPrincipal() principal: IUserPrincipal) {
    return this.clinicSettingsService.getClinicSettings(principal);
  }
}
