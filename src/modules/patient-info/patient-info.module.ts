import { HttpModule, Module } from '@nestjs/common';
import { PATIENT_INFO_REPOSITORY } from 'common/constants';
import { DatabaseModule } from 'modules/database/database.module';
import { PatientInfoListener } from './patient-info.listener';
import { PatientInfoModel } from './patient-info.model';
import { PatientInfoService } from './patient-info.service';

const patientInfoProviders = [{ provide: PATIENT_INFO_REPOSITORY, useValue: PatientInfoModel }];

@Module({
  imports: [DatabaseModule, HttpModule],
  providers: [PatientInfoService, ...patientInfoProviders, PatientInfoListener],
  exports: [PatientInfoService],
})
export class PatientInfoModule {}
