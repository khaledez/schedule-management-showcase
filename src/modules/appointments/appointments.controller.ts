import {
  Identity,
  IIdentity,
  PaginationInterceptor,
  PagingInfo,
  PagingInfoInterface,
  PermissionCode,
  Permissions,
} from '@monmedx/monmedx-common';
import {
  BadRequestException,
  Body,
  Controller,
  forwardRef,
  Get,
  Headers,
  Inject,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { DEFAULT_EVENT_DURATION_MINS } from 'common/constants';
import { AppointmentStatusEnum, CancelRescheduleReasonCode, ErrorCodes } from 'common/enums';
import { AppointmentStatusActions } from 'common/intercepter/appointment-status-actions';
import { UserError } from 'common/interfaces/user-error.interface';
import { GetPatientAppointmentHistoryDto } from 'modules/appointments/dto/get-patient-appointment-history-dto';
import { PatientInfoService } from 'modules/patient-info';
import { LookupsService } from '../lookups/lookups.service';
import { AppointmentsModel, AppointmentsModelAttributes } from './appointments.model';
import { AppointmentsService } from './appointments.service';
import { AdhocAppointmentDto } from './dto/appointment-adhoc.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentProvisionalBodyDto } from './dto/create-appointment-provisional-body.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsByPeriodsDto } from './dto/query-appointments-by-periods.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentEventPublisher, AppointmentsEventName } from './appointments.event-publisher';
import { ChangeAppointmentDoctorDto } from './dto/change-appointment-doctor-dto';

@Controller('appointments')
@UseInterceptors(AppointmentStatusActions)
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly lookupsService: LookupsService,
    @Inject(forwardRef(() => PatientInfoService))
    private readonly patientSvc: PatientInfoService,
    private readonly eventPublisher: AppointmentEventPublisher,
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
  @Permissions(PermissionCode.APPOINTMENT_READ)
  async getAppointmentsByPeriods(@Identity() identity: IIdentity, @Query() query: QueryAppointmentsByPeriodsDto) {
    this.logger.log({ query });
    this.logger.log({ identity });
    return {
      dayAppointments: await this.appointmentsService.getAppointmentsByPeriods(identity.clinicId, query),
    };
  }

  @Get(':id')
  @Permissions(PermissionCode.APPOINTMENT_READ)
  findOne(@Identity() identity: IIdentity, @Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(identity, id);
  }

  @Patch(':id')
  @Permissions(PermissionCode.APPOINTMENT_WRITE)
  async updateOneAppointment(
    @Identity() identity: IIdentity,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    const appointmentBeforeUpdate = await this.appointmentsService.findOne(identity, id);
    const appointment = await this.appointmentsService.updateAppointment(identity, id, updateAppointmentDto);
    this.eventPublisher.publishAppointmentEvent(
      AppointmentsEventName.APPOINTMENT_UPDATED,
      appointment,
      null,
      appointmentBeforeUpdate,
      identity,
    );
    return appointment;
  }

  /**
   * Get patient upcoming appointment
   */
  @Get('patient-upcoming/:patientId')
  getAppointmentByPatientId(@Identity() identity: IIdentity, @Param('patientId', ParseIntPipe) patientId: number) {
    return this.appointmentsService.getAppointmentByPatientId(identity, patientId);
  }

  /**
   * Create a provisional appointment
   * @deprecated
   * @param identity
   * @param authToken
   * @param appointmentData
   * @returns Created Appointment
   */
  @Post('provisional')
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

    await this.patientSvc.ensurePatientInfoIsActive(appointmentData.patientId, authToken);
    const appointment = await this.appointmentsService.createAppointment(identity, dto, true);
    this.eventPublisher.publishAppointmentEvent(
      AppointmentsEventName.APPOINTMENT_SET_PROVISIONAL,
      appointment,
      null,
      null,
      identity,
    );
    return { appointment };
  }

  /**
   *
   * @param identity
   * @param authToken
   * @param dto
   */
  @Post()
  async createAppointment(
    @Identity() identity: IIdentity,
    @Headers('Authorization') authToken: string,
    @Body() dto: CreateAppointmentDto,
  ): Promise<{ appointment?: AppointmentsModel; errors?: UserError[] }> {
    this.logger.debug({ identity, appointmentData: dto });

    await this.patientSvc.ensurePatientInfoIsActive(dto.patientId, authToken);
    const cancelReasonId = await this.lookupsService.getCancelRescheduleReasonByCode(
      identity,
      CancelRescheduleReasonCode.OTHER,
    );
    const previousAppointment = await this.appointmentsService.getPatientActiveAppointment(identity, dto.patientId);
    await this.validateVisitNotInProgress(identity, previousAppointment);
    const appointment = await this.appointmentsService.createPatientAppointment(
      identity,
      {
        ...dto,
        appointmentStatusId:
          dto.appointmentStatusId ??
          (await this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.SCHEDULE)),
      },
      true,
      cancelReasonId,
      'create new appointment',
    );
    const eventName = appointment
      ? AppointmentsEventName.APPOINTMENT_RESCHEDULED
      : AppointmentsEventName.APPOINTMENT_SCHEDULED;
    this.eventPublisher.publishAppointmentEvent(eventName, appointment, previousAppointment, null, identity);
    return { appointment };
  }

  @Post('reschedule')
  async rescheduleAppointment(@Identity() identity: IIdentity, @Body() dto: RescheduleAppointmentDto) {
    const previousAppointment = await this.appointmentsService.findOne(identity, dto.appointmentId);
    await this.validateVisitNotInProgress(identity, previousAppointment);
    const appointment = await this.appointmentsService.rescheduleAppointment(identity, dto);
    const eventName = dto.staffChangedPermanent
      ? AppointmentsEventName.APPOINTMENT_CANCELED
      : AppointmentsEventName.APPOINTMENT_RESCHEDULED;
    this.eventPublisher.publishAppointmentEvent(eventName, appointment, previousAppointment, null, identity);
    return { appointment: appointment };
  }

  @Post('cancel')
  async cancelAppointment(@Identity() identity: IIdentity, @Body() dto: CancelAppointmentDto) {
    const previousAppointment = await this.appointmentsService.findOne(identity, dto.appointmentId);
    await this.validateVisitNotInProgress(identity, previousAppointment);
    const appointment = await this.appointmentsService.cancelAppointment(identity, dto);
    this.eventPublisher.publishAppointmentEvent(
      AppointmentsEventName.APPOINTMENT_CANCELED,
      appointment,
      previousAppointment,
      null,
      identity,
    );
    return { appointment };
  }

  /**
   * Adhoc visit/appointment, is when a staff initiate a visit from patient's profile
   *
   * https://monmedx.atlassian.net/browse/MMX-4351
   *
   */
  @Post('adhoc')
  async adhocAppointment(
    @Identity() identity: IIdentity,
    @Headers('Authorization') authToken: string,
    @Body() dto: AdhocAppointmentDto,
  ): Promise<AppointmentsModel> {
    await this.patientSvc.ensurePatientInfoIsActive(dto.patientId, authToken);
    const previousAppointment = await this.appointmentsService.getAppointmentByPatientId(identity, dto.patientId);
    const appointment = await this.appointmentsService.adhocAppointment(identity, dto);
    const wasAppointmentUpdated = previousAppointment.id === appointment.id;
    this.eventPublisher.publishAppointmentEvent(
      wasAppointmentUpdated ? AppointmentsEventName.APPOINTMENT_UPDATED : AppointmentsEventName.APPOINTMENT_RESCHEDULED,
      appointment,
      wasAppointmentUpdated ? null : previousAppointment,
      wasAppointmentUpdated ? previousAppointment : null,
      identity,
    );
    return appointment;
  }

  @Post('forPatient')
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

  // search using post method
  @Post('user-appointments')
  @UseInterceptors(PaginationInterceptor)
  async userAppointments(
    @Identity() identity: IIdentity,
    @PagingInfo() pagingInfo: PagingInfoInterface,
    @Body() body: QueryParamsDto,
  ): Promise<unknown> {
    this.logger.debug({
      function: 'controller/appointment/user-appointments',
      identity,
      body,
    });
    const [data, count] = await this.appointmentsService.userPatientsAppointments(identity, body, pagingInfo);

    return {
      data,
      count,
    };
  }

  @Post(':id/confirmation')
  async confirmAppointment(
    @Identity() identity: IIdentity,
    @PagingInfo() pagingInfo: PagingInfoInterface,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<unknown> {
    this.logger.debug({
      function: 'controller/appointment/confirmAppointmentByApp',
      identity,
      id,
    });
    const appointmentBeforeUpdate = await this.appointmentsService.findOne(identity, id);
    const appointment = await this.appointmentsService.confirmAppointmentByApp(identity, id);
    this.eventPublisher.publishAppointmentEvent(
      AppointmentsEventName.APPOINTMENT_UPDATED,
      appointment,
      null,
      appointmentBeforeUpdate,
      identity,
    );
    return { appointment };
  }

  @Post('changeDoctor')
  async changeAppointmentDoctor(
    @Identity() identity: IIdentity,
    @Body() dto: ChangeAppointmentDoctorDto,
  ): Promise<unknown> {
    const previousAppointment = await this.appointmentsService.getAppointmentByPatientId(identity, dto.patientId);
    await this.validateVisitNotInProgress(identity, previousAppointment);
    const appointment = await this.appointmentsService.createPatientAppointment(
      identity,
      {
        patientId: dto.patientId,
        staffId: dto.doctorId,
        appointmentStatusId: dto.appointmentStatusId,
        appointmentTypeId: dto.appointmentTypeId ?? previousAppointment.appointmentTypeId,
        startDate: dto.provisionalDate ?? previousAppointment.startDate.toISOString(),
        durationMinutes: previousAppointment.durationMinutes,
      },
      true,
      await this.lookupsService.getCancelRescheduleReasonByCode(identity, CancelRescheduleReasonCode.CHANGE_DOCTOR),
      'Reschedule provisional appoint with new doctor',
    );
    this.eventPublisher.publishAppointmentEvent(
      AppointmentsEventName.APPOINTMENT_RESCHEDULED,
      appointment,
      previousAppointment,
      null,
      identity,
    );
    return { appointment: appointment };
  }

  /**
   * Throws an error if the patient active appointment is in progress
   * @param identity
   * @param appointment
   * @private
   */
  async validateVisitNotInProgress(identity: IIdentity, appointment: AppointmentsModelAttributes) {
    if (!appointment?.appointmentStatusId) {
      return;
    }
    const visitInProgress = await this.lookupsService.getStatusIdByCode(identity, AppointmentStatusEnum.VISIT);
    if (appointment.appointmentStatusId === visitInProgress) {
      throw new BadRequestException({
        fields: [],
        code: ErrorCodes.BAD_REQUEST,
        message: 'Patient has visit in progress',
      });
    }
  }
}
