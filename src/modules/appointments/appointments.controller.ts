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

    return this.appointmentsService.create({
      ...appointmentData,
      clinic_id: Number(clinic_id),
      created_by: Number(user_id),
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
      upcoming_appointment: true, // added this for returning it at the response. it should be deleted.
      date: data.provisional_date,
      date_extension_reason: data.reason_message,
      prev_appointment_id: Number(params.id),
      updated_by: 1,
      updated_at: new Date(),
    });
  }

  @Post(':id/cancellation')
  cancelAppointment(
    @Param() params: any, // TODO: add param interface
    @Body() data: CancelAppointmentBodyDto, // TODO: add cancel interface,
    @Headers() headers: Headers,
  ): Promise<AppointmentsModel> {
    // TODO : is_remove_availability_slot add your own code below.
    /*
     * your own code
     */
    // Q: Do we have cancel status that i have to change it here?
    // TODO: we need canceled_by, canceled_at fields?
    return this.appointmentsService.cancelAppointment({
      date: data.provisional_date,
      prev_appointment_id: Number(params.id),
      upcoming_appointment: true,
      cancellation_reason: data.reason_message,
      canceled_by: 1,
      canceled_at: new Date(),
    });
  }

  @Post(':id/doctor-assignment')
  reassign(
    @Param() params: any,
    @Body() data: ReassignAppointmentBodyDto,
    @Headers() headers: Headers,
  ): Promise<AppointmentsModel> {
    return this.appointmentsService.reassignAppointment({
      doctor_id: data.doctor_id,
      prev_appointment_id: Number(params.id),
      upcoming_appointment: true,
      updated_by: 1,
      updated_at: new Date(),
    });
  }

  @Post(':id/doctor-changing')
  changeDoctor(
    @Param() params: any,
    @Body() data: ChangeDoctorAppointmentBodyDto,
    @Headers() headers: Headers,
  ): Promise<AppointmentsModel> {
    return this.appointmentsService.changeDoctorAppointment({
      doctor_id: Number(data.doctor_id),
      doctor_reassignment_reason: data.reason_message,
      prev_appointment_id: Number(params.id),
      upcoming_appointment: true,
      updated_by: 1,
      updated_at: new Date(),
    });
  }
}
