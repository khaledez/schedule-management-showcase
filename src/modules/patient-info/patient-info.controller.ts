import { Body, Controller, Post } from '@nestjs/common';
import { Identity, IIdentity } from '@monmedx/monmedx-common';
import { ReactivatePatientDto } from './dto/reactivate-patient-dto';
import { PatientInfoService } from './patient-info.service';
import { PatientInfoAttributes } from './patient-info.model';
import { AppointmentsModelAttributes } from '../appointments/appointments.model';

@Controller('patient')
export class PatientInfoController {
  constructor(private readonly patientInfoService: PatientInfoService) {}

  @Post('reactivate')
  public reactivatePatient(
    @Identity() identity: IIdentity,
    @Body() payload: ReactivatePatientDto,
  ): Promise<{ appointment: AppointmentsModelAttributes; patient: PatientInfoAttributes }> {
    return this.patientInfoService.reactivatePatient(identity, payload);
  }
}
