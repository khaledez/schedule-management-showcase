import { Controller, Get, Post, Body, Headers, Param } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentBodyDto } from './dto/create-appointment.dto';
import { AppointmentsModel } from './models/appointments.model';
import { ExtendAppointmentBodyDto } from './dto/extend-appointment.dto';
import { CancelAppointmentBodyDto } from './dto/cancel-appointment.dto';
import { ReassignAppointmentBodyDto } from './dto/reassign-appointment.dto';
import { ChangeDoctorAppointmentBodyDto } from './dto/change-doctor-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}
  @Get()
  findAll(): Promise<AppointmentsModel[]> {
    return this.appointmentsService.findAll();
  }

  @Post()
  createAppointment(
    @Body() appointmentData: CreateAppointmentBodyDto,
    @Headers() headers: Headers,
  ): Promise<AppointmentsModel> {
    // todo: create a guard to validate the headers.
    // todo: validate past date.
    const cognito_id: string = headers['x-cognito-cognito-id'];
    const clinic_id: string = headers['x-mmx-clinic-id'];
    const user_lang: string = headers['x-mmx-lang'];
    const user_id: string = headers['x-cognito-user-id'];
    console.log({
      clinic_id,
      user_id,
    });
    return this.appointmentsService.create({
      ...appointmentData,
      clinicId: Number(clinic_id),
      createdBy: Number(user_id),
      provisionalDate: appointmentData.date,
    });
  }

  @Post(':id/date-extension')
  extendAppointmentDate(
    // add interface for params
    @Param() params: any,
    @Body() data: ExtendAppointmentBodyDto,
    @Headers() headers: Headers,
  ): Promise<AppointmentsModel> {
    console.log(data, headers);
    return this.appointmentsService.extendDate({
      upcomingAppointment: true, // added this for returning it at the response. it should be deleted.
      date: data.provisionalDate,
      dateExtensionReason: data.reasonMessage,
      prevAppointmentId: Number(params.id),
      updatedBy: 1,
      updatedAt: new Date(),
    });
  }

  @Post(':id/cancellation')
  cancelAppointment(
    @Param() params: any, // TODO: add param interface
    @Body() data: CancelAppointmentBodyDto, // TODO: add cancel interface,
    @Headers() headers: Headers,
  ): Promise<AppointmentsModel> {
    // TODO : isRemoveAvailability_slot add your own code below.
    /*
     * your own code
     */
    // Q: Do we have cancel status that i have to change it here?
    // TODO: we need canceledBy, canceledAt fields?
    return this.appointmentsService.cancelAppointment({
      date: data.provisionalDate,
      prevAppointmentId: Number(params.id),
      upcomingAppointment: true,
      cancellationReason: data.reasonMessage,
      canceledBy: 1,
      canceledAt: new Date(),
    });
  }

  @Post(':id/doctor-assignment')
  reassign(
    @Param() params: any,
    @Body() data: ReassignAppointmentBodyDto,
    @Headers() headers: Headers,
  ): Promise<AppointmentsModel> {
    return this.appointmentsService.reassignAppointment({
      doctorId: data.doctorId,
      prevAppointmentId: Number(params.id),
      upcomingAppointment: true,
      updatedBy: 1,
      updatedAt: new Date(),
    });
  }

  @Post(':id/doctor-changing')
  changeDoctor(
    @Param() params: any,
    @Body() data: ChangeDoctorAppointmentBodyDto,
    @Headers() headers: Headers,
  ): Promise<AppointmentsModel> {
    return this.appointmentsService.changeDoctorAppointment({
      doctorId: Number(data.doctorId),
      doctorReassignmentReason: data.reasonMessage,
      prevAppointmentId: Number(params.id),
      upcomingAppointment: true,
      updatedBy: 1,
      updatedAt: new Date(),
    });
  }
}
