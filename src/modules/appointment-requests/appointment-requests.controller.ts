import {
  Identity,
  IIdentity,
  PermissionCode,
  Permissions,
  TransactionInterceptor,
  TransactionParam,
} from '@monmedx/monmedx-common';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { Transaction } from 'sequelize';
import { AppointmentRequestsService } from './appointment-requests.service';
import {
  AppointmentRequestCancelAppointmentDto,
  CreateAppointmentRequestDto,
  featureStatusDto,
  RejectAppointmentRequestDto,
  UpdateAppointmentRequestDto,
} from './dto';
import { DataResponseInterceptor } from '../../common/intercepter';

@Controller('appointment-requests')
export class AppointmentRequestsController {
  constructor(private readonly appointmentRequestsService: AppointmentRequestsService) {}

  @Permissions(PermissionCode.APPT_REQUEST_WRITE)
  @UseInterceptors(TransactionInterceptor)
  @UseInterceptors(DataResponseInterceptor)
  @Get('feature-status')
  featureStatus(
    @TransactionParam() transaction: Transaction,
    @Query() requestDto: featureStatusDto,
    @Identity() identity: IIdentity,
  ) {
    return this.appointmentRequestsService.featureStatus(requestDto, identity, transaction);
  }

  @Permissions(PermissionCode.APPT_REQUEST_READ)
  @UseInterceptors(DataResponseInterceptor)
  @UseInterceptors(TransactionInterceptor)
  @Get('patient/:patientId')
  getRequestByPatientId(
    @TransactionParam() transaction: Transaction,
    @Param('patientId', ParseIntPipe) patientId: number,
    @Identity() identity: IIdentity,
  ) {
    return this.appointmentRequestsService.getRequestByPatientId(patientId, identity, transaction);
  }

  @Permissions(PermissionCode.APPT_REQUEST_READ)
  @UseInterceptors(DataResponseInterceptor)
  @UseInterceptors(TransactionInterceptor)
  @Get(':id')
  getRequestById(
    @TransactionParam() transaction: Transaction,
    @Param('id', ParseIntPipe) id: number,
    @Identity() identity: IIdentity,
  ) {
    return this.appointmentRequestsService.getRequestById(id, identity, transaction);
  }

  @Permissions(PermissionCode.APPT_REQUEST_WRITE)
  @UseInterceptors(DataResponseInterceptor)
  @UseInterceptors(TransactionInterceptor)
  @Post()
  create(
    @TransactionParam() transaction: Transaction,
    @Body() requestDto: CreateAppointmentRequestDto,
    @Identity() identity: IIdentity,
  ) {
    return this.appointmentRequestsService.create(requestDto, identity, transaction);
  }

  @Permissions(PermissionCode.APPT_REQUEST_WRITE)
  @UseInterceptors(DataResponseInterceptor)
  @UseInterceptors(TransactionInterceptor)
  @Patch(':id')
  update(
    @TransactionParam() transaction: Transaction,
    @Body() requestDto: UpdateAppointmentRequestDto,
    @Identity() identity: IIdentity,
  ) {
    return this.appointmentRequestsService.update(requestDto, identity, transaction);
  }

  @Permissions(PermissionCode.APPT_REQUEST_WRITE)
  @UseInterceptors(DataResponseInterceptor)
  @UseInterceptors(TransactionInterceptor)
  @Delete(':id')
  cancelRequest(
    @TransactionParam() transaction: Transaction,
    @Param('id', ParseIntPipe) id: number,
    @Identity() identity: IIdentity,
  ) {
    return this.appointmentRequestsService.cancelRequest(id, identity, transaction);
  }

  @Permissions(PermissionCode.APPT_REQUEST_WRITE)
  @UseInterceptors(TransactionInterceptor)
  @UseInterceptors(DataResponseInterceptor)
  @Post('appointment/:id')
  cancelAppointment(
    @TransactionParam() transaction: Transaction,
    @Body() requestDto: AppointmentRequestCancelAppointmentDto,
    @Identity() identity: IIdentity,
  ) {
    return this.appointmentRequestsService.cancelAppointment(requestDto, identity, transaction);
  }

  @Permissions(PermissionCode.APPT_REQUEST_REJECT)
  @UseInterceptors(TransactionInterceptor)
  @UseInterceptors(DataResponseInterceptor)
  @Post('/:id/reject')
  RejectAppointmentRequest(
    @TransactionParam() transaction: Transaction,
    @Body() requestDto: RejectAppointmentRequestDto,
    @Identity() identity: IIdentity,
  ) {
    return this.appointmentRequestsService.RejectAppointmentRequest(requestDto, identity, transaction);
  }
}
