import { IUserPrincipal, PermissionCode, Permissions, UserPrincipal } from '@monmedx/monmedx-common';
import { Controller, Get } from '@nestjs/common';
import { ClinicSettingsService } from './clinic-settings.service';

@Controller('clinic-settings')
export class ClinicSettingController {
  constructor(private readonly clinicSettingsService: ClinicSettingsService) {}

  @Get()
  @Permissions(PermissionCode.CLINIC_SETTINGS_READ)
  clinicSetting(@UserPrincipal() principal: IUserPrincipal) {
    return this.clinicSettingsService.getClinicSettings(principal);
  }
}
