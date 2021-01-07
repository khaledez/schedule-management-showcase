import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentBodyDto } from './dto/create-appointment.dto';
import { AppointmentsModel } from './models/appointments.model';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}
  @Get()
  findAll(): Promise<AppointmentsModel[]> {
    return this.appointmentsService.findAll();
  }

  @Post()
  async createAppointment(
    @Body() appointmentData: CreateAppointmentBodyDto,
    @Headers() headers: Headers,
  ): Promise<AppointmentsModel> {
    // todo: create a guard to validate the headers.
    // todo: validate past date.
    const cognito_id: string = headers['x-cognito-cognito-id'];
    const clinic_id: string = headers['x-mmx-clinic-id'];
    const user_lang: string = headers['x-mmx-lang'];
    const user_id: string = headers['x-cognito-user-id'];

    return await this.appointmentsService.create({
      ...appointmentData,
      clinic_id: Number(clinic_id),
      created_by: Number(user_id),
    });
  }
}
