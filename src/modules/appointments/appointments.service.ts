import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { APPOINTMENTS_REPOSITORY } from '../../common/constants/index';
import { AppointmentsModel } from './models/appointments.model';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ExtendAppointmentDto } from './dto/extend-appointment.dto';

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

  async extendDate(
    extendAppointmentDto: ExtendAppointmentDto,
  ): Promise<AppointmentsModel> {
    const { old_appointment_id, ...othersData } = extendAppointmentDto;
    const oldAppointment = await this.appoitmentsRepo.findByPk(
      old_appointment_id,
    );
    await oldAppointment.update({
      ...oldAppointment,
      is_active:false
    });
    return this.appoitmentsRepo.create({
      ...oldAppointment,
      ...othersData,
    });
  }
}
