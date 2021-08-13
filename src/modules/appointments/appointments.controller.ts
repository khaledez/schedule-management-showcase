import {
  Identity,
  IIdentity,
  PaginationInterceptor,
  PagingInfo,
  PagingInfoInterface,
  PermissionCode,
  Permissions,
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
import { DEFAULT_EVENT_DURATION_MINS } from 'common/constants';
import { AppointmentStatusEnum } from 'common/enums/appointment-status.enum';
import { UserError } from 'common/interfaces/user-error.interface';
import { GetPatientAppointmentHistoryDto } from 'modules/appointments/dto/get-patient-appointment-history-dto';
import { GetPatientNextAppointment } from 'modules/appointments/dto/get-patient-next-appointment';
import { PatientInfoService } from 'modules/patient-info';
import { Transaction } from 'sequelize';
import { LookupsService } from '../lookups/lookups.service';
import { AppointmentsModel } from './appointments.model';
import { AppointmentsService } from './appointments.service';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentAdhocDto } from './dto/create-appointment-adhoc.dto';
import { CreateAppointmentProvisionalBodyDto } from './dto/create-appointment-provisional-body.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsByPeriodsDto } from './dto/query-appointments-by-periods.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
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
  // @Permissions(PermissionCode.APPOINTMENT_READ)
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
  // @Permissions(PermissionCode.APPOINTMENT_READ)
  async getAppointmentsByPeriods(@Identity() identity: IIdentity, @Query() query: QueryAppointmentsByPeriodsDto) {
    this.logger.log({ query });
    this.logger.log({ identity });
    return {
      dayAppointments: await this.appointmentsService.getAppointmentsByPeriods(identity.clinicId, query),
    };
  }

  @Get(':id')
  // @Permissions(PermissionCode.APPOINTMENT_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  // @Permissions(PermissionCode.APPOINTMENT_WRITE)
  updateOneAppointment(
    @Identity() identity: IIdentity,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.updateAppointment(identity, id, updateAppointmentDto);
  }

  /**
   * @deprecated use {getPatientUpcomingAppointment} & {GetPatientNextAppointment} instead
   */
  @Get('patient-upcoming/:patientId')
  // @Permissions(PermissionCode.APPOINTMENT_READ)
  getAppointmentByPatientId(
    @Identity() identity: IIdentity,
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query() query: UpComingAppointmentQueryDto,
  ) {
    return this.appointmentsService.getAppointmentByPatientId(identity, patientId, query);
  }

  /**
   * Returns patient upcoming appointment which is the appointment with {@link AppointmentsModelAttributes.upcomingAppointment} == True
   * @param identity
   * @param patientId
   */
  @Get('upcoming-appointment/:patientId')
  // @Permissions(PermissionCode.APPOINTMENT_READ)
  getPatientUpcomingAppointment(@Identity() identity: IIdentity, @Param('patientId', ParseIntPipe) patientId: number) {
    return this.appointmentsService.getPatientUpcomingAppointment(identity, patientId);
  }

  /**
   * Returns the patient next appointment with id > {@link GetPatientNextAppointment.appointmentId}
   * @param identity
   * @param query continas patientId & appointmentId
   * @constructor
   */
  @Get('patient-next-appointment')
  // @Permissions(PermissionCode.APPOINTMENT_READ)
  GetPatientNextAppointment(@Identity() identity: IIdentity, @Query() query: GetPatientNextAppointment) {
    return this.appointmentsService.getPatientNextAppointment(identity, query.patientId, query.appointmentId);
  }

  /**
   * Create a provisional appointment
   * @deprecated
   * @param identity
   * @param appointmentData
   * @returns Created Appointment
   */
  @Post('provisional')
  // @Permissions(PermissionCode.APPOINTMENT_WRITE)
  async createProvisionalAppointment(
    @Identity() identity: IIdentity,
    @Headers('Authorization') authToken: string,
    @Body() appointmentData: CreateAppointmentProvisionalBodyDto,
  ): Promise<{ appointment?: AppointmentsModel; errors?: UserError[] }> {
    this.logger.debug({
      function: 'appointment/createProvisionalAppointment',
      identity,
      appointmentData,
    });

    const dto = new CreateAppointmentDto();
    dto.patientId = appointmentData.patientId;
    dto.startDate = appointmentData.date.toISOString();
    dto.durationMinutes = DEFAULT_EVENT_DURATION_MINS;
    dto.appointmentTypeId = await this.lookupsService.getProvisionalAppointmentStatusId(identity);

    await this.patientSvc.ensurePatientInfoIsAvailable(appointmentData.patientId, authToken);
    return { appointment: await this.appointmentsService.createAppointment(identity, dto, true) };
  }

  /**
   *
   * @param identity
   * @param appointmentData
   */
  @Post()
  // @Permissions(PermissionCode.APPOINTMENT_WRITE)
  async createAppointment(
    @Identity() identity: IIdentity,
    @Headers('Authorization') authToken: string,
    @Body() appointmentData: CreateAppointmentDto,
  ): Promise<{ appointment?: AppointmentsModel; errors?: UserError[] }> {
    this.logger.debug({ identity, appointmentData });

    await this.patientSvc.ensurePatientInfoIsAvailable(appointmentData.patientId, authToken);
    return { appointment: await this.appointmentsService.createAppointment(identity, appointmentData, false) };
  }

  @Post('reschedule')
  // @Permissions(PermissionCode.APPOINTMENT_WRITE)
  async rescheduleAppointment(@Identity() identity: IIdentity, @Body() rescheduleDto: RescheduleAppointmentDto) {
    return { appointment: await this.appointmentsService.rescheduleAppointment(identity, rescheduleDto) };
  }

  @Post('cancel')
  // @Permissions(PermissionCode.APPOINTMENT_WRITE)
  async cancelAppointment(@Identity() identity: IIdentity, @Body() cancelDto: CancelAppointmentDto) {
    await this.appointmentsService.cancelAppointment(identity, cancelDto);
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
  // @Permissions(PermissionCode.APPOINTMENT_WRITE)
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

    const readyStatus = await this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.READY);
    const typeFUBId = await this.lookupsService.getFUBAppointmentTypeId(identity);

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

  @Post('forPatient')
  // @Permissions(PermissionCode.APPOINTMENT_READ)
  @UseInterceptors(PaginationInterceptor)
  async getPatientAppointmentHistory(
    @Identity() identity: IIdentity,
    @PagingInfo() pagingFilter: PagingInfoInterface,
    @Body() payload: GetPatientAppointmentHistoryDto,
  ): Promise<unknown> {
    const [data, count] = await this.appointmentsService.getPatientAppointmentHistory(identity, pagingFilter, payload);
    return {
      data,
      count,
    };
  }
}
