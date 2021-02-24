import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  Query,
  Param,
  ParseIntPipe,
  UseInterceptors,
  SetMetadata,
  Patch,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentProvisionalBodyDto } from './dto/create-appointment-provisional-body.dto';
import { AppointmentsModel } from './models/appointments.model';
import { AppointmentResponseInterface } from './interfaces/appointment-response.interface';
import { IdentityDto } from '../../common/dtos/identity.dto';
import { CreateAppointmentBodyDto } from './dto/create-appointment-body.dto';
import { QueryAppointmentsByPeriodsDto } from './dto/query-appointments-by-periods.dto';
import { Identity } from '@mon-medic/common';
import { QueryParamsDto } from 'src/common/dtos/query-params.dto';
import { BadRequestException } from '@nestjs/common';
import { ErrorCodes } from 'src/common/enums/error-code.enum';
import { CreateNonProvisionalAppointmentDto } from './dto/create-non-provisional-appointment.dto';
import { FilterBodyDto } from 'src/common/dtos/filter-body.dto';
import { PaginationInterceptor } from '../../common/interceptor/pagination.interceptor';
import { LookupsService } from '../lookups/lookups.service';
import { AppointmentStatusEnum } from 'src/common/enums/appointment-status.enum';

@Controller('appointments')
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly lookupsService: LookupsService,
  ) {}

  // search using post method
  @UseInterceptors(PaginationInterceptor)
  @SetMetadata('modle', 'AppointmentsModel')
  @Post('search')
  search(@Identity() identity: IdentityDto, @Body() body: FilterBodyDto) {
    this.logger.debug({
      function: 'controller/appointment/search',
      identity,
      body,
    });
    const { first, last, before, after } = body;
    if ((!!first && !!last) || (!!before && !!after)) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_INPUT,
        message: 'Invalid Query filters!',
      });
    }
    return this.appointmentsService.findAll({ query: body, identity });
  }
  /**
   * Find all appointments
   * @param identity
   */
  // TODO: Remove this function
  @Get()
  findAll(
    @Identity() identity: IdentityDto,
    @Query() query: QueryParamsDto,
  ): Promise<AppointmentResponseInterface[]> {
    this.logger.debug({
      function: 'controller/appointment/findAll',
      identity,
      query,
    });
    const { first, last, before, after } = query;
    if ((!!first && !!last) || (!!before && !!after)) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_INPUT,
        message: 'Invalid Query filters!',
      });
    }
    return this.appointmentsService.findAll({ query, identity });
  }

  // get total appointment for each day for aspecific period
  @Get('appointments-days')
  async getAppointmentsByPeriods(
    @Identity() identity: IdentityDto,
    @Query() query: QueryAppointmentsByPeriodsDto,
  ) {
    this.logger.log({ query });
    this.logger.log({ identity });
    return {
      dayAppointments: await this.appointmentsService.getAppointmentsByPeriods(
        identity.clinicId,
        query,
      ),
    };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  // TODO: delete this after ability to change status
  @Patch(':id')
  PatchOne(@Param('id', ParseIntPipe) id: number, @Body() body) {
    return this.appointmentsService.patchAppointment(id, body);
  }

  //TODO: MMX-S3 create a function for not provisional appointments only.
  /**
   * Create a provisional appointment
   * @param identity
   * @param appointmentData
   * @returns Created Appointment
   */
  @Post('provisional')
  async createProvisionalAppointment(
    @Identity() identity: IdentityDto,
    @Body() appointmentData: CreateAppointmentProvisionalBodyDto,
  ): Promise<AppointmentsModel> {
    this.logger.debug({
      function: 'appointment/createProvisionalAppointment',
      identity,
      appointmentData,
    });

    const waitlistStatusId = await this.lookupsService.getStatusIdByCode(
      AppointmentStatusEnum.WAIT_LIST,
    );
    // TODO: what if i entered the same body dto multiple-time!
    return this.appointmentsService.createProvisionalAppointment({
      ...appointmentData,
      appointmentStatusId: waitlistStatusId, // TODO: get this id from appointmentStatusModel at the service.
      clinicId: identity.clinicId,
      createdBy: identity.userId,
      provisionalDate: appointmentData.date,
    });
  }

  /**
   *
   * @param identity
   * @param appointmentData
   */
  @Post()
  createAppointment(
    @Identity() identity: IdentityDto,
    @Body() appointmentData: CreateAppointmentBodyDto,
  ): Promise<AppointmentsModel> {
    this.logger.debug({ identity, appointmentData });
    return this.appointmentsService.createNonProvisionalAppointment({
      ...appointmentData,
      clinicId: identity.clinicId,
      createdBy: identity.userId,
    });
  }

  /**
   *
   * @param identity
   * @param appointmentData
   * create not provisional appointment for backdoor.
   */
  @Post('backdoor')
  createAppointmentBackdoorApi(
    @Identity() identity: IdentityDto,
    @Body() appointmentData: CreateNonProvisionalAppointmentDto,
  ): Promise<AppointmentsModel> {
    this.logger.debug({ identity, appointmentData });
    return this.appointmentsService.createNonProvisionalAppointment({
      ...appointmentData,
      clinicId: identity.clinicId,
      createdBy: identity.userId,
      provisionalDate: appointmentData.date,
    });
  }
}
