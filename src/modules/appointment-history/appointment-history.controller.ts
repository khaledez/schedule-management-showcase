import { Controller, Get, Logger, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AppointmentHistoryService } from './appointment-history.service';
import { Identity, IIdentity, PermissionCode, Permissions } from '@monmedx/monmedx-common';
import { GetAppointmentStatusHistory } from './dto/get-appointment-status-history';

@Controller('appointment-history')
export class AppointmentHistoryController {
  private readonly logger = new Logger(AppointmentHistoryController.name);

  constructor(private readonly appointmentHistoryService: AppointmentHistoryService) {}

  @Get(':id/status')
  @Permissions(PermissionCode.APPOINTMENT_READ)
  findOne(
    @Identity() identity: IIdentity,
    @Param('id', ParseIntPipe) id: number,
    @Query() dto: GetAppointmentStatusHistory,
  ) {
    return this.appointmentHistoryService.getAppointmentStatusHistoryEntries(identity, id, dto.oldestFirst);
  }
}
