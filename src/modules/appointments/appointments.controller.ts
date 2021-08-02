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
import { AppointmentStatusEnum } from 'common/enums/appointment-status.enum';
import { PatientInfoService } from 'modules/patient-info';
import { Transaction } from 'sequelize';
import { LookupsService } from '../lookups/lookups.service';
import { AppointmentsModel } from './appointments.model';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentAdhocDto } from './dto/create-appointment-adhoc.dto';
import { CreateAppointmentProvisionalBodyDto } from './dto/create-appointment-provisional-body.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsByPeriodsDto } from './dto/query-appointments-by-periods.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { UpComingAppointmentQueryDto } from './dto/upcoming-appointment-query.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

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
    const [data, count] = await this.appointmentsService.searchWithPatientInfo(identity, body, pagingInfo);

    return {
      data,
      count,
    };
  }

  // get total appointment for each day for a specific period
  @Get('appointments-days')
  async getAppointmentsByPeriods(@Identity() identity: IIdentity, @Query() query: QueryAppointmentsByPeriodsDto) {
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

  @Patch(':id')
  updateOneAppointment(
    @Identity() identity: IIdentity,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.updateAppointment(identity, id, updateAppointmentDto);
  }

  @Get('patient-upcoming/:patientId')
  getAppointmentByPatientId(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query() query: UpComingAppointmentQueryDto,
  ) {
    return this.appointmentsService.findAppointmentByPatientId(patientId, query);
  }

  /**
   * Create a provisional appointment
   * @deprecated
   * @param identity
   * @param appointmentData
   * @returns Created Appointment
   */
  @UseInterceptors(TransactionInterceptor)
  @Post('provisional')
  async createProvisionalAppointment(
    @Identity() identity: IIdentity,
    @Headers('Authorization') authToken: string,
    @Body() appointmentData: CreateAppointmentProvisionalBodyDto,
    @TransactionParam() transaction: Transaction,
  ): Promise<AppointmentsModel> {
    this.logger.debug({
      function: 'appointment/createProvisionalAppointment',
      identity,
      appointmentData,
    });

    await this.patientSvc.ensurePatientInfoIsAvailable(appointmentData.patientId, authToken);

    const waitListStatusId = await this.lookupsService.getStatusIdByCode(AppointmentStatusEnum.WAIT_LIST);
    return this.appointmentsService.createProvisionalAppointment(
      {
        ...appointmentData,
        appointmentStatusId: waitListStatusId, // TODO: get this id from appointmentStatusModel at the service.
        clinicId: identity.clinicId,
        createdBy: identity.userId,
        provisionalDate: appointmentData.date,
      },
      transaction,
    );
  }

  /**
   *
   * @param identity
   * @param appointmentData
   */
  @Post()
  async createAppointment(
    @Identity() identity: IIdentity,
    @Headers('Authorization') authToken: string,
    @Body() appointmentData: CreateAppointmentDto,
  ): Promise<AppointmentsModel> {
    this.logger.debug({ identity, appointmentData });

    await this.patientSvc.ensurePatientInfoIsAvailable(appointmentData.patientId, authToken);
    return this.appointmentsService.createNonProvisionalAppointment({
      ...appointmentData,
      clinicId: identity.clinicId,
      createdBy: identity.userId,
    });
  }

  /**
   * @deprecated
   * @param identity
   * @param appointmentData
   * @param transaction
   * @returns
   */
  @UseInterceptors(TransactionInterceptor)
  @Post('adhoc')
  async createAdHoc(
    @Identity() identity: IIdentity,
    @Body() appointmentData: CreateAppointmentAdhocDto,
    @TransactionParam() transaction: Transaction,
  ): Promise<AppointmentsModel> {
    this.logger.debug({
      function: 'appointment/createAdHoc',
      identity,
      appointmentData,
    });

    const readyStatus = await this.lookupsService.getStatusIdByCode(AppointmentStatusEnum.READY);
    const typeFUBId = await this.lookupsService.getTypeByCode('FUP');

    this.logger.debug({
      appointmentData,
      readyStatus,
      typeFUBId: `${typeFUBId}`,
    });

    return this.appointmentsService.createAnAppointmentWithFullResponse(
      {
        ...appointmentData,
        appointmentStatusId: readyStatus,
        clinicId: identity.clinicId,
        createdBy: identity.userId,
        appointmentTypeId: typeFUBId,
        provisionalDate: appointmentData.date,
      },
      transaction,
    );
  }
}
