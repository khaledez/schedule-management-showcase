import { IIdentity } from '@dashps/monmedx-common';
import {
  BadRequestException,
  CacheInterceptor,
  CACHE_MANAGER,
  Inject,
  Injectable,
  Logger,
  UseInterceptors,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import {
  APPOINTMENT_ACTIONS_LOOKUPS_REPOSITORY,
  APPOINTMENT_CANCEL_RESCHEDUEL_REASON_REPOSITORY,
  APPOINTMENT_STATUS_LOOKUPS_REPOSITORY,
  APPOINTMENT_TYPES_LOOKUPS_REPOSITORY,
  APPOINTMENT_VISIT_MODE_LOOKUP_REPOSITORY,
  BAD_REQUEST,
  DURATION_MINUTES_LOOKUPS_REPOSITORY,
  TIME_GROUPS_LOOKUPS_REPOSITORY,
} from 'common/constants';
import { AppointmentActionEnum, AppointmentVisitModeEnum, CancelRescheduleReasonCode } from 'common/enums';
import { AppointmentStatusEnum } from 'common/enums/appointment-status.enum';
import { AppointmentTypesEnum as AppointmentTypeEnum } from 'common/enums/appointment-type.enum';
import { FindOptions, Op, Transaction } from 'sequelize';
import { Cached } from 'utils/cached.decorator';
import { LookupWithCodeAttributes } from './models';
import { AppointmentActionsLookupsModel } from './models/appointment-actions.model';
import { AppointmentCancelRescheduleReasonLookupModel } from './models/appointment-cancel-reschedule-reason.model';
import { AppointmentStatusLookupsModel } from './models/appointment-status.model';
import { AppointmentTypesLookupsModel } from './models/appointment-types.model';
import { AppointmentVisitModeLookupModel } from './models/appointment-visit-mode.model';
import { DurationMinutesLookupsModel } from './models/duration-minutes.model';
import { TimeGroupsLookupsModel } from './models/time-groups.model';

@Injectable()
@UseInterceptors(CacheInterceptor)
export class LookupsService {
  private readonly logger = new Logger(LookupsService.name);

  constructor(
    @Inject(DURATION_MINUTES_LOOKUPS_REPOSITORY)
    private readonly durationMinutesLookupsRepository: typeof DurationMinutesLookupsModel,
    @Inject(TIME_GROUPS_LOOKUPS_REPOSITORY)
    private readonly timeGroupsLookupsRepository: typeof TimeGroupsLookupsModel,
    @Inject(APPOINTMENT_ACTIONS_LOOKUPS_REPOSITORY)
    private readonly appointmentActionsLookupsRepository: typeof AppointmentActionsLookupsModel,
    @Inject(APPOINTMENT_TYPES_LOOKUPS_REPOSITORY)
    private readonly appointmentTypesLookupsRepository: typeof AppointmentTypesLookupsModel,
    @Inject(APPOINTMENT_STATUS_LOOKUPS_REPOSITORY)
    private readonly appointmentStatusLookupsRepository: typeof AppointmentStatusLookupsModel,
    @Inject(APPOINTMENT_VISIT_MODE_LOOKUP_REPOSITORY)
    private readonly appointmentVisitModeRepository: typeof AppointmentVisitModeLookupModel,
    @Inject(APPOINTMENT_CANCEL_RESCHEDUEL_REASON_REPOSITORY)
    private readonly appointmentCancelRescheduleReasonRepo: typeof AppointmentCancelRescheduleReasonLookupModel,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  /**
   *
   * Find the duration minutes in the system + clinic if it exists
   * @param identity xmmx user identifiers
   * duration minutes like 5 Mins, 15 Mins or 30.
   */
  public findAllDurationMinutesLookups(identity): Promise<DurationMinutesLookupsModel[]> {
    const { clinicId } = identity;
    return this.durationMinutesLookupsRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: [null, clinicId],
        },
      },
    });
  }
  /**
   * Find time groups in the system + clinic if it exists
   * @param identity
   * lookup example: morning, afternoon, evening
   */
  public findAllTimeGroupsLookups(identity): Promise<TimeGroupsLookupsModel[]> {
    const { clinicId } = identity;
    return this.timeGroupsLookupsRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: [null, clinicId],
        },
      },
    });
  }
  /**
   * Find appointment actions
   * @param identity
   * example: CANCEL, CHANGE_APPT_TYPE, CHANGE_DOCTOR
   */
  public findAllAppointmentActionsLookups(identity): Promise<AppointmentActionsLookupsModel[]> {
    const { clinicId } = identity;
    return this.appointmentActionsLookupsRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: [null, clinicId],
        },
      },
    });
  }
  /**
   * Find Appointment types
   * @param identity
   * example: NEW, FUP
   */
  @Cached(({ clinicId = 0 }: IIdentity) => `appttypes-${clinicId}`)
  public findAllAppointmentTypesLookups(
    identity: IIdentity,
    transaction?: Transaction,
  ): Promise<AppointmentTypesLookupsModel[]> {
    const conditions: FindOptions<AppointmentTypesLookupsModel> = identity?.clinicId
      ? {
          where: {
            clinicId: {
              [Op.or]: [null, identity.clinicId],
            },
          },
          transaction,
        }
      : {};

    return this.appointmentTypesLookupsRepository.findAll(conditions);
  }
  /**
   * Find Appointment status
   * @param identity
   * example: READY, CHECK-IN
   */
  @Cached(({ clinicId }: IIdentity) => `apptstatus-${clinicId}`)
  public findAllAppointmentStatusLookups(
    identity,
    transaction?: Transaction,
  ): Promise<AppointmentStatusLookupsModel[]> {
    const { clinicId } = identity;
    return this.appointmentStatusLookupsRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: [null, clinicId],
        },
      },
      transaction,
    });
  }

  @Cached(({ clinicId }: IIdentity) => `visitmode-${clinicId}`)
  findAllAppointmentVisitModes(
    { clinicId }: IIdentity,
    transaction?: Transaction,
  ): Promise<LookupWithCodeAttributes[]> {
    return this.appointmentVisitModeRepository.findAll({
      where: {
        clinicId: {
          [Op.or]: [null, clinicId],
        },
      },
      transaction,
    });
  }

  @Cached(({ clinicId }: IIdentity) => `cancelreschedule-${clinicId}`)
  public findAllAppointmentCancelRescheduleReasons({
    clinicId,
  }: IIdentity): Promise<AppointmentCancelRescheduleReasonLookupModel[]> {
    return this.appointmentCancelRescheduleReasonRepo.findAll({
      where: {
        clinicId: {
          [Op.or]: [null, clinicId],
        },
      },
    });
  }

  //TODO: MMX-CurrentSprint => static value
  nextAppointmentActions = {
    WAIT_LIST: [
      AppointmentActionEnum.CHANGE_DATE,
      AppointmentActionEnum.CHANGE_APPT_TYPE,
      AppointmentActionEnum.CHANGE_DOCTOR,
    ],
    SCHEDULE: [
      AppointmentActionEnum.CANCEL,
      AppointmentActionEnum.CHANGE_DATE,
      AppointmentActionEnum.CHANGE_APPT_TYPE,
      AppointmentActionEnum.RESCHEDULE_APPT,
    ],
    CONFIRM: [AppointmentActionEnum.CANCEL, AppointmentActionEnum.CHANGE_APPT_TYPE],
    CHECK_IN: [AppointmentActionEnum.CANCEL],
    READY: [AppointmentActionEnum.CANCEL],
    COMPLETE: [],
  };

  /**
   * find Appointments Primary And Secondary Actions By Array Of Status Ids
   * @param ids AppointmentsStatusId
   */
  public async findAppointmentsActions(ids: Array<number>) {
    try {
      const internalAppointmentsStatus = this.appointmentStatusLookupsRepository.findAll();
      const internalAppointmentsActions = await this.appointmentActionsLookupsRepository.findAll();
      const appointmentActionsPlain = internalAppointmentsActions.map((e) => e.get({ plain: true }));

      const nextActions = {
        WAIT_LIST: {
          Primary: ['SCHEDULE'],
          Secondary: ['CHANGE_APPT_TYPE', 'RELEASE_PATIENT'],
        },
        SCHEDULE: {
          Primary: ['CONFIRM1'],
          Secondary: [
            'CONFIRM2',
            'CHECK_IN',
            'READY',
            'RESCHEDULE_APPT',
            'CANCEL',
            'CHANGE_APPT_TYPE',
            'RELEASE_PATIENT',
          ],
        },
        CONFIRM1: {
          Primary: ['CONFIRM2'],
          Secondary: ['CHECK_IN', 'READY', 'RESCHEDULE_APPT', 'CANCEL', 'CHANGE_APPT_TYPE', 'RELEASE_PATIENT'],
        },
        CONFIRM2: {
          Primary: ['CHECK_IN'],
          Secondary: ['READY', 'RESCHEDULE_APPT', 'CANCEL', 'CHANGE_APPT_TYPE', 'RELEASE_PATIENT'],
        },
        CHECK_IN: {
          Primary: ['READY'],
          Secondary: ['RESCHEDULE_APPT', 'CANCEL', 'CHANGE_APPT_TYPE', 'RELEASE_PATIENT'],
        },
        READY: {
          Primary: ['RESCHEDULE_APPT'],
          Secondary: ['CANCEL', 'CHANGE_APPT_TYPE', 'RELEASE_PATIENT'],
        },
        IN_PROGRESS: {
          Primary: [],
          Secondary: [],
        },
        COMPLETE: {
          Primary: [],
          Secondary: [],
        },
        CANCELED: {
          Primary: [],
          Secondary: [],
        },
      };

      const internalStatuses = await internalAppointmentsStatus;
      // TODO: MMX-S4/S5 create fcm and check the status
      // At S2 status are sorted in the order so the next id is next status
      const appointmentsActions = ids.map((id: number) => {
        const statusData = internalStatuses.find((statusObj) => statusObj.id === id);
        const primaryAction = nextActions[statusData.code].Primary[0];
        const secondaryActions = nextActions[statusData.code].Secondary || [];
        return {
          currentActionId: id,
          // next status type calculated depend ids !!!
          // nextAction: internalAppointmentsStatus.find((statusObj) => statusObj.id === id + 1),
          nextAction: appointmentActionsPlain.find((ele) => ele.code === primaryAction),
          secondaryActions: secondaryActions.length
            ? appointmentActionsPlain.filter((e: AppointmentActionsLookupsModel) => secondaryActions.includes(e.code))
            : [],
        };
      });

      return appointmentsActions;
    } catch (error) {
      throw new BadRequestException({
        function: 'findAppointmentsActions error',
        error,
      });
    }
  }

  @Cached(({ clinicId }: IIdentity, code: AppointmentStatusEnum) => `apptstatusid-${clinicId}-${code.toString()}`)
  public async getStatusIdByCode({ clinicId }: IIdentity | null, code: AppointmentStatusEnum): Promise<number> {
    if (!Object.keys(AppointmentStatusEnum).includes(code)) {
      throw new BadRequestException({
        fields: [],
        code: 'NOT_FOUND',
        message: 'This status does not exits!',
      });
    }
    const result = await this.appointmentStatusLookupsRepository.findOne({
      where: {
        code,
        clinicId: {
          [Op.or]: [null, clinicId],
        },
      },
      attributes: ['id'],
    });
    return result.id;
  }

  @Cached(({ clinicId }: IIdentity, code: AppointmentStatusEnum) => `appttypeid-${clinicId}-${code.toString()}`)
  async getTypeByCode({ clinicId }: IIdentity | null, code: AppointmentTypeEnum): Promise<number> {
    if (!Object.keys(AppointmentTypeEnum).includes(code)) {
      throw new BadRequestException({
        fields: [],
        code: 'NOT_FOUND',
        message: 'This type does not exits!',
      });
    }
    const result = await this.appointmentTypesLookupsRepository.findOne({
      where: {
        code,
        clinicId: {
          [Op.or]: [null, clinicId],
        },
      },
      attributes: ['id'],
    });
    return result?.id;
  }

  @Cached(
    ({ clinicId }: IIdentity, code: CancelRescheduleReasonCode) => `apptcancelresid-${clinicId}-${code.toString()}`,
  )
  getCancelRescheduleReasonByCode(
    { clinicId }: IIdentity,
    code: CancelRescheduleReasonCode,
    transaction?: Transaction,
  ): Promise<number> {
    return this.appointmentCancelRescheduleReasonRepo
      .findOne({
        where: {
          code,
          clinicId: {
            [Op.or]: [null, clinicId],
          },
        },
        attributes: ['id'],
        transaction,
      })
      .then((model) => model?.id);
  }

  @Cached((id: number) => `apptcancelres-${id}`)
  getCancelRescheduleReasonById(
    id: number,
    transaction?: Transaction,
  ): Promise<AppointmentCancelRescheduleReasonLookupModel> {
    return this.appointmentCancelRescheduleReasonRepo.findByPk(id, { transaction, plain: true });
  }

  async getVisitModeByCode(code: AppointmentVisitModeEnum): Promise<number> {
    const result = await this.appointmentVisitModeRepository.findOne({
      where: {
        code,
      },
      attributes: ['id'],
    });
    return result?.id;
  }

  /**
   * Validate if a given list of appointments ids are valid types
   *
   * @param identity
   * @param appointmentTypesIds List of the appointment ids to be validated
   */
  public async validateAppointmentsTypes(
    identity: IIdentity,
    appointmentTypesIds: Array<number>,
    transaction?: Transaction,
  ): Promise<void> {
    if (!appointmentTypesIds || appointmentTypesIds.length === 0) {
      return;
    }
    const allAppointmentTypes = await this.findAllAppointmentTypesLookups(identity, transaction);
    const validTypesIds = [...new Set(allAppointmentTypes.map((appointmentType) => appointmentType.id))];
    const invalidIds = appointmentTypesIds.filter((id) => !validTypesIds.includes(id));

    if (invalidIds.length !== 0) {
      throw new BadRequestException({
        invalidIds,
        fields: ['appointmentTypeId'],
        message: `The appointment types doesn't exist: [${invalidIds}]`,
        code: BAD_REQUEST,
      });
    }
  }

  async validateAppointmentVisitModes(
    identity: IIdentity,
    appointmentVisitModeIds: number[],
    transaction?: Transaction,
  ): Promise<void> {
    if (!appointmentVisitModeIds || appointmentVisitModeIds.length === 0) {
      return;
    }
    const lookupData = await this.appointmentVisitModeRepository.findAll({
      where: {
        id: appointmentVisitModeIds,
        clinicId: {
          [Op.or]: [null, identity?.clinicId],
        },
      },
      transaction,
    });

    const distinctIds = [...new Set(appointmentVisitModeIds)];

    if (distinctIds.length !== lookupData.length && distinctIds.length > 0) {
      const returnedIds = lookupData.map((lookup) => lookup.id);
      const unknownIds = distinctIds.filter((id) => returnedIds.indexOf(id) < 0);
      throw new BadRequestException({
        message: `unknown visit mode ID`,
        fields: ['appointmentVisitModeId'],
        unknownIds,
      });
    }
  }

  async validateAppointmentCancelRescheduleReason(
    identity: IIdentity,
    appointmentCancelReschReasonIds: number[],
    transaction?: Transaction,
  ): Promise<void> {
    if (!appointmentCancelReschReasonIds || appointmentCancelReschReasonIds.length === 0) {
      return;
    }

    const lookupData = await this.appointmentCancelRescheduleReasonRepo.findAll({
      where: {
        id: appointmentCancelReschReasonIds,
        clinicId: {
          [Op.or]: [null, identity?.clinicId],
        },
      },
      transaction,
    });

    const distinctIds = [...new Set(appointmentCancelReschReasonIds)];

    if (distinctIds.length !== lookupData.length && distinctIds.length > 0) {
      const returnedIds = lookupData.map((lookup) => lookup.id);
      const unknownIds = distinctIds.filter((id) => !returnedIds.includes(id));
      throw new BadRequestException({
        message: `unknown cancel reschedule reason ID`,
        fields: ['cancel_reschedule_reason_id', 'reasonId'],
        unknownIds,
      });
    }
  }

  async validateAppointmentStatuses(
    identity: IIdentity,
    appointmentStatusIds: number[],
    transaction?: Transaction,
  ): Promise<void> {
    if (!appointmentStatusIds || appointmentStatusIds.length === 0) {
      return;
    }
    const lookupData = await this.appointmentStatusLookupsRepository.findAll({
      where: {
        id: appointmentStatusIds,
        clinicId: {
          [Op.or]: [null, identity?.clinicId],
        },
      },
      transaction,
    });

    const distinctIds = [...new Set(appointmentStatusIds)];

    if (distinctIds.length !== lookupData.length && distinctIds.length > 0) {
      const returnedIds = lookupData.map((lookup) => lookup.id);
      const unknownIds = distinctIds.filter((id) => returnedIds.indexOf(id) < 0);
      throw new BadRequestException({
        message: `unknown appointment status ID`,
        fields: ['appointmentStatusId'],
        unknownIds,
      });
    }
  }

  getProvisionalAppointmentStatusId(identity: IIdentity): Promise<number> {
    return this.getStatusIdByCode(identity, AppointmentStatusEnum.WAIT_LIST);
  }

  async getActiveAppointmentsStatuses(identity: IIdentity) {
    const result = await this.appointmentStatusLookupsRepository.findAll({
      where: {
        code: {
          [Op.notIn]: [AppointmentStatusEnum.WAIT_LIST, AppointmentStatusEnum.CANCELED, AppointmentStatusEnum.COMPLETE],
        },
        clinicId: {
          [Op.or]: [null, identity.clinicId],
        },
      },
      attributes: ['id'],
    });
    return result.map((status) => status.id);
  }

  getReadyAppointmentStatusId(identity: IIdentity): Promise<number> {
    return this.getStatusIdByCode(identity, AppointmentStatusEnum.READY);
  }

  getScheduleAppointmentStatusId(identity: IIdentity): Promise<number> {
    return this.getStatusIdByCode(identity, AppointmentStatusEnum.SCHEDULE);
  }

  getFUBAppointmentTypeId(identity: IIdentity): Promise<number> {
    return this.getTypeByCode(identity, AppointmentTypeEnum.FUP);
  }
}
