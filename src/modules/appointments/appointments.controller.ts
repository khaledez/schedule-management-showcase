import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Param,
  Logger,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentBodyDto } from './dto/create-appointment-body.dto';
import { AppointmentsModel } from './models/appointments.model';
import { Identity } from '../../common/decorators/cognitoIdentity.decorator';
import { IdentityKeysInterface } from '../../common/interfaces/identity-keys.interface';

@Controller('appointments')
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);
  constructor(
    private readonly appointmentsService: AppointmentsService, // @Inject('SEQUELIZE') // private sequelize: Sequelize,
  ) {}

  @Get()
  findAll(
    @Identity() identity: IdentityKeysInterface,
  ): Promise<AppointmentsModel[]> {
    return this.appointmentsService.findAll();
  }

  @Post()
  createAppointment(
    @Identity() identity: IdentityKeysInterface,
    @Body() appointmentData: CreateAppointmentBodyDto,
  ): Promise<AppointmentsModel> {
    // TODO: what if i entered the same body dto multiple-time!
    return this.appointmentsService.create({
      ...appointmentData,
      appointmentStatusId: 1, // TODO: get this id from appointmentStatusModel at the service.
      clinicId: identity.clinicId,
      createdBy: identity.userId,
      provisionalDate: appointmentData.date,
    });
  }
}
