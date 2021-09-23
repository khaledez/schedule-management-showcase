import { IIdentity } from '@monmedx/monmedx-common';
import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpService,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_EVENT_DURATION_MINS,
  PATIENT_INFO_REPOSITORY,
  PATIENT_UPDATE_REQUEST_EVENT_NAME,
  SCHEDULE_MGMT_TOPIC,
  SEQUELIZE,
} from 'common/constants';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ErrorCodes } from '../../common/enums';
import { PatientStatus } from '../../common/enums/patient-status';
import { ChangeAssingedDoctorPayload } from '../../common/interfaces/change-assinged-doctor';
import { AppointmentsService } from '../appointments/appointments.service';
import { LookupsService } from '../lookups/lookups.service';
import { ReactivatePatientDto } from './dto/reactivate-patient-dto';
import { PatientInfoPayload, patientInfoPayloadToAttributes } from './patient-info.listener';
import { PatientInfoAttributes, PatientInfoModel } from './patient-info.model';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { snsTopic } = require('pubsub-service');

@Injectable()
export class PatientInfoService {
  private readonly logger = new Logger(PatientInfoService.name);
  patientMgmtBaseURL: URL;
  constructor(
    @Inject(PATIENT_INFO_REPOSITORY)
    private readonly patientRepo: typeof PatientInfoModel,
    @Inject(SEQUELIZE) private sequelize: Sequelize,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
    private readonly lookupsService: LookupsService,
    private readonly httpSvc: HttpService,
    configService: ConfigService<{ apiURL: string }>,
  ) {
    this.patientMgmtBaseURL = new URL('/patient-management/patients', configService.get<string>('apiURL'));
  }

  async update(patientInfo: PatientInfoAttributes, transaction?: Transaction): Promise<PatientInfoAttributes> {
    await this.patientRepo.update(
      {
        id: patientInfo.id,
        clinicId: patientInfo.clinicId,
        fullName: patientInfo.fullName,
        primaryHealthPlanNumber: patientInfo.primaryHealthPlanNumber,
        dob: patientInfo.dob,
        statusCode: patientInfo.statusCode,
        doctorId: patientInfo.doctorId,
        legacyId: patientInfo.legacyId,
        userId: patientInfo.userId,
      },
      {
        where: { id: patientInfo.id },
        returning: true,
        sideEffects: true,
        transaction,
      },
    );
    return (await this.patientRepo.findOne({ transaction, where: { id: patientInfo.id } })).get({ plain: true });
  }

  async changeAssignedDoctor(payload: ChangeAssingedDoctorPayload) {
    try {
      this.logger.debug({
        method: 'changeAssignedDoctor',
        payload,
      });

      const { clinicId, patientId, doctorId } = payload;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

      await this.publishPatientProfileUpdateEvent(clinicId, patientId, { patientId, doctorId });

      return affected_rows[0]?.get({ plain: true });
    } catch (error) {
      this.logger.error({
        method: 'appointmentsService/changePatientAssignedDoctor',
        error,
      });
    }
    return false;
  }

  publishPatientProfileUpdateEvent(clinicId, patientId, data): Promise<unknown> {
    if (process.env.NODE_ENV === 'test') {
      return Promise.resolve();
    }
    return snsTopic.sendSnsMessage(SCHEDULE_MGMT_TOPIC, {
      eventName: PATIENT_UPDATE_REQUEST_EVENT_NAME,
      source: SCHEDULE_MGMT_TOPIC,
      clinicId,
      patientId,
      credentials: '',
      data: data,
    });
  }

  /**
   *
   * @param patientInfo
   * @returns the same input
   */
  create(patientInfo: PatientInfoAttributes): Promise<PatientInfoAttributes> {
    return this.patientRepo.create({
      id: patientInfo.id,
      clinicId: patientInfo.clinicId,
      fullName: patientInfo.fullName,
      primaryHealthPlanNumber: patientInfo.primaryHealthPlanNumber,
      dob: patientInfo.dob,
      statusCode: patientInfo.statusCode,
      doctorId: patientInfo.doctorId,
      legacyId: patientInfo.legacyId,
      userId: patientInfo.userId,
    });
  }

  getById(id: number, transaction?: Transaction): Promise<PatientInfoAttributes | null> {
    return this.patientRepo.findByPk(id, { transaction }).then((model) => (model ? model.get({ plain: true }) : model));
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

  /**
   * Return patient info by clinicId and patientId
   */
  getClinicPatientById(clinicId: number, patientId: number) {
    return this.patientRepo
      .findOne({ where: { id: patientId, clinicId: clinicId } })
      .then((model) => (model ? model.get({ plain: true }) : model));
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

  async ensurePatientInfoIsActive(patientId: number, authorizationToken: string): Promise<void> {
    // 1. check our local table
    let localData = await this.getById(patientId);
    if (!localData) {
      // 2. fetch patient info and store it
      try {
        const patientData = await this.fetchPatientInfo(authorizationToken, patientId);
        localData = await this.create(patientData);
      } catch (error) {
        throw new InternalServerErrorException({ description: 'Unable to fetch patient Info', error });
      }
    }
    // 3. Check if patient is active
    if (localData.statusCode !== PatientStatus.ACTIVE) {
      throw new BadRequestException({
        message: 'You are attempting to create an appointment for non-active patient',
        code: ErrorCodes.BAD_REQUEST,
      });
    }
  }

  /**
   * Reactivates patient and create new provisional appointment
   * @param identity
   * @param payload
   */
  async reactivatePatient(identity: IIdentity, payload: ReactivatePatientDto) {
    const { patientId, provisionalDate, notes } = payload;
    const { clinicId } = identity;
    const patientInfo = await this.getClinicPatientById(identity.clinicId, patientId);
    if (!patientInfo) {
      throw new BadRequestException({
        fields: ['patientId'],
        message: `Unknown patientId ${patientId}`,
        code: ErrorCodes.NOT_FOUND,
      });
    }
    if (patientInfo.statusCode === PatientStatus.ACTIVE) {
      throw new BadRequestException({
        message: `Patient is already active`,
        code: ErrorCodes.BAD_REQUEST,
      });
    }

    return this.sequelize.transaction(async (transaction) => {
      patientInfo.statusCode = PatientStatus.ACTIVE;
      await this.update(patientInfo, transaction);
      const appointment = await this.appointmentsService.createProvisionalAppointment(
        identity,
        {
          patientId,
          appointmentTypeId: await this.lookupsService.getFUBAppointmentTypeId(identity),
          startDate: provisionalDate,
          durationMinutes: DEFAULT_EVENT_DURATION_MINS,
          staffId: patientInfo.doctorId,
          complaintsNotes: notes,
        },
        transaction,
      );
      this.publishPatientProfileUpdateEvent(clinicId, patientId, {
        patientId,
        statusCode: PatientStatus.ACTIVE,
      }).catch((error) => {
        this.logger.error({
          message: 'Failed publishing patient activate event',
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          error: error,
        });
      });
      return { appointment: appointment.get({ plain: true }), patient: patientInfo };
    });
  }

  async releasePatient(clinicId: number, patientId: number) {
    const patientInfo = await this.getById(patientId);
    patientInfo.statusCode = PatientStatus.RELEASED;
    const updatePatientInfo = await this.update(patientInfo);
    this.publishPatientProfileUpdateEvent(clinicId, patientId, {
      patientId,
      statusCode: updatePatientInfo.statusCode,
    }).catch((error) => {
      this.logger.error({
        message: 'Failed publishing patient released event',
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        error: error,
      });
    });
    return updatePatientInfo;
  }
}
