import { Controller, Get, Post, Body, Logger, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentBodyDto } from './dto/create-appointment-body.dto';
import { AppointmentsModel } from './models/appointments.model';
import { Identity } from '../../common/decorators/cognitoIdentity.decorator';
import { IdentityKeysInterface } from '../../common/interfaces/identity-keys.interface';
import { AppointmentResponseInterface } from './interfaces/appointment-response.intreface';
import { FindAppointmentsQueryParams } from './dto/find-appointment-query-params.dto';

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
    @Identity() identity: IdentityKeysInterface,
    @Query() query: FindAppointmentsQueryParams,
  ): Promise<AppointmentResponseInterface[]> {
    this.logger.debug({
      function: 'controller/appointment/findAll',
      identity,
      query,
    });
    return this.appointmentsService.findAll({ query });
  }

  //TODO: MMX-S3 create a function for not provisional appointments only.
  /**
   * Create a provisional appointment
   * @param identity
   * @param appointmentData
   * @returns Created Appointment //TODO: MMX-currentSprint return full data
   */
  @Post()
  createProvisionalAppointment(
    @Identity() identity: IdentityKeysInterface,
    @Body() appointmentData: CreateAppointmentBodyDto,
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

  /**
   *
   * @param identity
   * @param appointmentData
   * create not provisional appointment for testing.
   */
  @Post('/simple')
  createSimpleAppointment(
    @Identity() identity: IdentityKeysInterface,
    @Body() appointmentData,
  ): Promise<AppointmentsModel> {
    this.logger.debug({ identity, appointmentData });
    return this.appointmentsService.create({
      ...appointmentData,
      appointmentStatusId: appointmentData.appointmentStatusId,
      clinicId: identity.clinicId,
      createdBy: identity.userId,
      provisionalDate: appointmentData.date,
    });
  }
}
