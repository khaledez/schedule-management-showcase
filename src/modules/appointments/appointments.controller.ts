import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentProvisionalBodyDto } from './dto/create-appointment-provisional-body.dto';
import { AppointmentsModel } from './models/appointments.model';
import { Identity } from '../../common/decorators/cognitoIdentity.decorator';
import { AppointmentResponseInterface } from './interfaces/appointment-response.interface';
import { FindAppointmentsQueryParams } from './dto/find-appointment-query-params.dto';
import { IdentityDto } from '../../common/dtos/identity.dto';
import { CreateAppointmentBodyDto } from './dto/create-appointment-body.dto';

@Controller('appointments')
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Find all appointments
   * @param identity
   */
  @Get()
  findAll(
    @Identity() identity: IdentityDto,
    @Query() query: FindAppointmentsQueryParams,
  ): Promise<AppointmentResponseInterface[]> {
    this.logger.debug({
      function: 'controller/appointment/findAll',
      identity,
      query,
    });
    return this.appointmentsService.findAll({ query });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  //TODO: MMX-S3 create a function for not provisional appointments only.
  /**
   * Create a provisional appointment
   * @param identity
   * @param appointmentData
   * @returns Created Appointment
   */
  @Post('provisional')
  createProvisionalAppointment(
    @Identity() identity: IdentityDto,
    @Body('input') appointmentData: CreateAppointmentProvisionalBodyDto,
  ): Promise<AppointmentsModel> {
    this.logger.debug({
      function: 'appointment/createProvisionalAppointment',
      identity,
      appointmentData,
    });
    // TODO: what if i entered the same body dto multiple-time!
    return this.appointmentsService.create({
      ...appointmentData,
      appointmentStatusId: 1, // TODO: get this id from appointmentStatusModel at the service.
      clinicId: identity.clinicId,
      createdBy: identity.userId,
      provisionalDate: appointmentData.date,
    });
  }

  // @Post('filter')
  // filterAppointments(
  //   @Body() body
  // ): Promise<AppointmentsModel>{
  //   return this.appointmentsService.filterAppointments(body);
  // }

  /**
   *
   * @param identity
   * @param appointmentData
   * create not provisional appointment for testing.
   */
  @Post()
  createAppointment(
    @Identity() identity: IdentityDto,
    @Body('input') appointmentData: CreateAppointmentBodyDto,
  ): Promise<AppointmentsModel> {
    this.logger.debug({ identity, appointmentData });
    return this.appointmentsService.create({
      ...appointmentData,
      clinicId: identity.clinicId,
      createdBy: identity.userId,
    });
  }
}
