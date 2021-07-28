import {
  Identity,
  IIdentity,
  PaginationInterceptor,
  PagingInfo,
  PagingInfoInterface,
  TransactionInterceptor,
  TransactionParam,
} from '@dashps/monmedx-common';
import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { PatientInfoService } from 'modules/patient-info';
import { Transaction } from 'sequelize';
import { QueryParamsDto } from '../../common/dtos';
import { IdentityDto } from '../../common/dtos/identity.dto';
import { AppointmentStatusEnum } from '../../common/enums/appointment-status.enum';
import { LookupsService } from '../lookups/lookups.service';
import { AppointmentsModel } from './appointments.model';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentBodyDto } from './dto/create-appointment-body.dto';
import { CreateAppointmentProvisionalBodyDto } from './dto/create-appointment-provisional-body.dto';
import { QueryAppointmentsByPeriodsDto } from './dto/query-appointments-by-periods.dto';
import { UpComingAppointmentQueryDto } from './dto/upcoming-appointment-query.dto';

@Controller('appointments')
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly lookupsService: LookupsService,
    private readonly patientSvc: PatientInfoService,
  ) {}

  // search using post method
  @Post('search')
  @UseInterceptors(PaginationInterceptor)
  async search(
    @Identity() identity: IIdentity,
    @PagingInfo() pagingInfo: PagingInfoInterface,
    @Body() body: QueryParamsDto,
  ): Promise<unknown> {
    this.logger.debug({
      function: 'controller/appointment/search',
      identity,
      body,
    });
    const [data, pageInfo] = await this.appointmentsService.searchWithPatientInfo(identity, body, pagingInfo);

    return {
      data,
      ...pageInfo,
    };
  }

  // get total appointment for each day for a specific period
  @Get('appointments-days')
  async getAppointmentsByPeriods(@Identity() identity: IdentityDto, @Query() query: QueryAppointmentsByPeriodsDto) {
    this.logger.log({ query });
    this.logger.log({ identity });
    return {
      dayAppointments: await this.appointmentsService.getAppointmentsByPeriods(identity.clinicId, query),
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

  @Get('patient-upcoming/:patientId')
  getAppointmentByPatientId(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query() query: UpComingAppointmentQueryDto,
    //@Identity() identity: IdentityDto,
  ) {
    return this.appointmentsService.findAppointmentByPatientId(patientId, query);
  }

  //TODO: MMX-S3 create a function for not provisional appointments only.
  /**
   * Create a provisional appointment
   * @param identity
   * @param appointmentData
   * @returns Created Appointment
   */
  @UseInterceptors(TransactionInterceptor)
  @Post('provisional')
  async createProvisionalAppointment(
    @Identity() identity: IdentityDto,
    @Headers('Authorization') authToken: string,
    @Body() appointmentData: CreateAppointmentProvisionalBodyDto,
    @TransactionParam() transaction: Transaction,
  ): Promise<AppointmentsModel> {
    this.logger.debug({
      function: 'appointment/createProvisionalAppointment',
      identity,
      appointmentData,
    });

    const patientPromise = this.patientSvc.ensurePatientInfoIsAvailable(appointmentData.patientId, authToken);

    const waitListStatusId = await this.lookupsService.getStatusIdByCode(AppointmentStatusEnum.WAIT_LIST);
    // TODO: what if i entered the same body dto multiple-time!
    const apptPromise = this.appointmentsService.createProvisionalAppointment(
      {
        ...appointmentData,
        appointmentStatusId: waitListStatusId, // TODO: get this id from appointmentStatusModel at the service.
        clinicId: identity.clinicId,
        createdBy: identity.userId,
        provisionalDate: appointmentData.date,
      },
      transaction,
    );

    const [appt] = await Promise.all([apptPromise, patientPromise]);

    return appt;
  }

  /**
   *
   * @param identity
   * @param appointmentData
   */
  @Post()
  async createAppointment(
    @Identity() identity: IdentityDto,
    @Headers('Authorization') authToken: string,
    @Body() appointmentData: CreateAppointmentBodyDto,
  ): Promise<AppointmentsModel> {
    this.logger.debug({ identity, appointmentData });

    const patientPromise = this.patientSvc.ensurePatientInfoIsAvailable(appointmentData.patientId, authToken);
    const apptPromise = this.appointmentsService.createNonProvisionalAppointment({
      ...appointmentData,
      clinicId: identity.clinicId,
      createdBy: identity.userId,
    });

    const [appt] = await Promise.all([apptPromise, patientPromise]);

    return appt;
  }
}
