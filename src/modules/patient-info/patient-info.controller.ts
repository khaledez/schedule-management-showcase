import { Body, Controller, Post } from '@nestjs/common';
import { Identity, IIdentity } from '@monmedx/monmedx-common';
import { ReactivatePatientDto } from './dto/reactivate-patient-dto';
import { PatientInfoService } from './patient-info.service';
import { PatientInfoAttributes } from './patient-info.model';
import { AppointmentsModelAttributes } from '../appointments/appointments.model';
import { AppointmentEventPublisher, AppointmentsEventName } from '../appointments/appointments.event-publisher';

@Controller('patient')
export class PatientInfoController {
  constructor(
    private readonly patientInfoService: PatientInfoService,
    private readonly eventPublisher: AppointmentEventPublisher,
  ) {}

  @Post('reactivate')
  public async reactivatePatient(
    @Identity() identity: IIdentity,
    @Body() payload: ReactivatePatientDto,
  ): Promise<{ appointment: AppointmentsModelAttributes; patient: PatientInfoAttributes }> {
    const result = await this.patientInfoService.reactivatePatient(identity, payload);
    this.eventPublisher.publishAppointmentEvent(
      AppointmentsEventName.APPOINTMENT_SET_PROVISIONAL,
      result.appointment,
      null,
      null,
      identity,
    );
    return result;
  }
}
