import { HttpException, HttpService, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  APPOINTMENT_CHANGE_PATIENT_ASSIGNED_DOCTOR,
  PATIENT_INFO_REPOSITORY,
  SCHEDULE_MGMT_TOPIC,
} from 'common/constants';
import { PatientInfoPayload, patientInfoPayloadToAttributes } from './patient-info.listener';
import { PatientInfoAttributes, PatientInfoModel } from './patient-info.model';
import { Op } from 'sequelize';
import { ChangeAssingedDoctorPayload } from '../../common/interfaces/change-assinged-doctor';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { snsTopic } = require('pubsub-service');

@Injectable()
export class PatientInfoService {
  private readonly logger = new Logger(PatientInfoService.name);
  patientMgmtBaseURL: URL;
  constructor(
    @Inject(PATIENT_INFO_REPOSITORY)
    private readonly patientRepo: typeof PatientInfoModel,
    private readonly httpSvc: HttpService,
    configService: ConfigService<{ apiURL: string }>,
  ) {
    this.patientMgmtBaseURL = new URL('/patient-management/patients', configService.get<string>('apiURL'));
  }

  async update(patientInfo: PatientInfoAttributes): Promise<PatientInfoAttributes> {
    const [patient] = await this.patientRepo.upsert(patientInfo);

    return patient.get({ plain: true });
  }

  async changeAssignedDoctor(payload: ChangeAssingedDoctorPayload) {
    try {
      this.logger.debug({
        method: 'changeAssignedDoctor',
        payload,
      });

      const { clinicId, patientId, doctorId } = payload;

      const [affected_count, affected_rows] = await this.patientRepo.update(
        {
          doctorId: doctorId,
        },
        {
          where: {
            id: patientId,
          },
        },
      );

      await snsTopic.sendSnsMessage(SCHEDULE_MGMT_TOPIC, {
        eventName: APPOINTMENT_CHANGE_PATIENT_ASSIGNED_DOCTOR,
        source: SCHEDULE_MGMT_TOPIC,
        clinicId,
        patientId,
        doctorId,
        data: payload,
      });

      return affected_rows[0]?.get({ plain: true });
    } catch (error) {
      this.logger.error({
        method: 'appointmentsService/changePatientAssignedDoctor',
        error,
      });
    }
    return false;
  }

  /**
   *
   * @param patientInfo
   * @returns the same input
   */
  create(patientInfo: PatientInfoAttributes): Promise<PatientInfoAttributes> {
    return this.patientRepo.create(patientInfo);
  }

  getById(id: number): Promise<PatientInfoAttributes | null> {
    return this.patientRepo.findByPk(id).then((model) => (model ? model.get({ plain: true }) : model));
  }

  async deleteById(id: number): Promise<void> {
    await this.patientRepo.destroy({ where: { id } });
  }

  async deleteByIdsList(ids: number[]): Promise<void> {
    await this.patientRepo.destroy({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    });
  }

  async fetchPatientInfo(authorizationToken: string, patientId: number): Promise<PatientInfoAttributes> {
    const reqURL = new URL(`${this.patientMgmtBaseURL}/${patientId}`);

    const result = await this.httpSvc
      .get<PatientInfoPayload>(reqURL.toString(), {
        headers: { Authorization: authorizationToken },
      })
      .toPromise();

    if (result.status !== 200 || result.data.errors) {
      throw new HttpException(result.data, result.status);
    }

    return patientInfoPayloadToAttributes(result.data);
  }

  async ensurePatientInfoIsAvailable(patientId: number, authorizationToken: string): Promise<void> {
    // 1. check our local table
    const localData = await this.getById(patientId);
    if (localData) {
      return;
    }

    // 2. fetch patient info and store it
    try {
      const patientData = await this.fetchPatientInfo(authorizationToken, patientId);
      await this.create(patientData);
    } catch (error) {
      throw new InternalServerErrorException({ description: 'Unable to fetch patient Info', error });
    }
  }
}
