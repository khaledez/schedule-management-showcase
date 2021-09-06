import { Identity, IIdentity, TransactionInterceptor, TransactionParam } from '@monmedx/monmedx-common';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseInterceptors } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { AppointmentRequestsService } from './appointment-requests.service';
import {
  AppointmentRequestCancelAppointmentDto,
  CreateAppointmentRequestDto,
  UpdateAppointmentRequestDto,
} from './dto';
import { RescheduleAppointmentRequestDto } from './dto/reschedule-appointment-request.dto';

@Controller('appointment-requests')
export class AppointmentRequestsController {
  constructor(private readonly appointmentRequestsService: AppointmentRequestsService) {}

  //@Permissions(PermissionCode.APPT_REQUEST_READ)
  @UseInterceptors(TransactionInterceptor)
  @Get(':id')
  getRequestById(
    @TransactionParam() transaction: Transaction,
    @Param('id', ParseIntPipe) id: number,
    @Identity() identity: IIdentity,
  ) {
    return this.appointmentRequestsService.getRequestById(id, identity, transaction);
  }

  //@Permissions(PermissionCode.APPT_REQUEST_CREATE)
  @UseInterceptors(TransactionInterceptor)
  @Post()
  create(
    @TransactionParam() transaction: Transaction,
    @Body() requestDto: CreateAppointmentRequestDto,
    @Identity() identity: IIdentity,
  ) {
    return this.appointmentRequestsService.createScheduleAppointment(requestDto, identity, transaction);
  }

  //@Permissions(PermissionCode.APPT_REQUEST_CREATE)
  @UseInterceptors(TransactionInterceptor)
  @Post('appointment/:id')
  reschedule(
    @TransactionParam() transaction: Transaction,
    @Body() requestDto: RescheduleAppointmentRequestDto,
    @Identity() identity: IIdentity,
  ) {
    return this.appointmentRequestsService.rescheduleAppointmentRequest(requestDto, identity, transaction);
  }

  //@Permissions(PermissionCode.APPT_REQUEST_UPDATE)
  @UseInterceptors(TransactionInterceptor)
  @Patch('id')
  update(
    @TransactionParam() transaction: Transaction,
    @Body() requestDto: UpdateAppointmentRequestDto,
    @Identity() identity: IIdentity,
  ) {
    return this.appointmentRequestsService.update(requestDto, identity, transaction);
  }

  //@Permissions(PermissionCode.APPT_REQUEST_CANCEL)
  @UseInterceptors(TransactionInterceptor)
  @Delete(':id')
  cancelRequest(
    @TransactionParam() transaction: Transaction,
    @Param('id', ParseIntPipe) id: number,
    @Identity() identity: IIdentity,
  ) {
    //return this.appointmentRequestsService.cancelRequest(id, identity, transaction);
  }

  //@Permissions(PermissionCode.APPT_REQUEST_CANCEL)
  @UseInterceptors(TransactionInterceptor)
  @Delete('appointment/:id')
  cancelAppointment(
    @TransactionParam() transaction: Transaction,
    @Body() requestDto: AppointmentRequestCancelAppointmentDto,
    @Identity() identity: IIdentity,
  ) {
    //return this.appointmentRequestsService.cancelAppointment(requestDto, identity, transaction);
  }
}
