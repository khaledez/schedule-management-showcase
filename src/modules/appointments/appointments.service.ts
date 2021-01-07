import { Injectable, Inject } from '@nestjs/common';
import { APPOINTMENTS_REPOSITORY } from '../../common/constants/index';
import { AppointmentsModel } from './models/appointments.model';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject(APPOINTMENTS_REPOSITORY)
    private readonly appoitmentsRepo: typeof AppointmentsModel,
  ) {}

  findAll(): Promise<AppointmentsModel[]> {
    return this.appoitmentsRepo.findAll();
  }

  create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<AppointmentsModel> {
    return this.appoitmentsRepo.create(createAppointmentDto);
  }
}
