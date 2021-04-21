import { Injectable, Inject, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { AvailabilityModel } from './models/availability.model';
import { AVAILABILITY_REPOSITORY, SEQUELIZE } from 'src/common/constants';
import { CreateAvailabilityDto } from './dto/create.dto';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Transaction } from 'sequelize/types';
import { BulkUpdateResult } from './interfaces/availability-bulk-update.interface';
import { AppointmentTypesLookupsModel } from '../lookups/models/appointment-types.model';
import { ErrorCodes } from 'src/common/enums/error-code.enum';
import { AvailabilityEdgesInterface } from './interfaces/availability-edges.interface';
import { UpdateAvailabilityDto } from './dto/update.dto';
import { BulkUpdateAvailabilityDto } from './dto/add-or-update-availability-body.dto';
import { DateTime } from 'luxon';
import { AvailabilityCreationAttributes, AvailabilityModelAttributes } from './models/availability.interfaces';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: typeof AvailabilityModel,
    @Inject(SEQUELIZE)
    private readonly sequelize: Sequelize,
  ) {}

  async findAll({ identity }): Promise<AvailabilityEdgesInterface> {
    const { clinicId } = identity;
    const availability = await this.availabilityRepository.findAll({
      include: [
        {
          model: AppointmentTypesLookupsModel,
          as: 'type',
        },
      ],
      where: {
        clinicId,
      },
    });
    const availabilityAsPlain = availability.map((e) => e.get({ plain: true }));
    return {
      edges: availabilityAsPlain.map((e: AvailabilityModel) => ({
        cursor: e.id,
        node: e,
      })),
      pageInfo: {},
    };
  }

  async findOne(id: number): Promise<AvailabilityModel> {
    const availability = await this.availabilityRepository.findByPk(id, {
      include: [
        {
          model: AppointmentTypesLookupsModel,
          as: 'type',
        },
      ],
    });
    if (!availability) {
      throw new NotFoundException({
        fields: [],
        code: 'NOT_FOUND',
        message: 'This availability does not exits!',
      });
    }
    return availability;
  }

  async findNotBookedAvailability(availabilityId: number): Promise<AvailabilityModel> {
    const availability = await this.availabilityRepository.findOne({
      where: {
        id: availabilityId,
        appointmentId: {
          [Op.eq]: null,
        },
      },
    });
    return availability;
  }

  /**
   *
   * @param ids array of availability ids to be deleted
   *
   */
  private async bulkRemove(ids: Array<number>, userId: number, transaction: Transaction): Promise<Array<number>> {
    try {
      await this.availabilityRepository.update(
        {
          deletedBy: userId,
          deletedAt: new Date(),
        },
        {
          where: {
            id: {
              [Op.in]: ids,
            },
          },
          transaction,
        },
      );

      return ids;
    } catch (error) {
      throw new BadRequestException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'Error occur while delete bulk availability',
        error,
      });
    }
  }

  private bulkCreateUpdate(
    create: Array<CreateAvailabilityDto>,
    update: Array<UpdateAvailabilityDto>,
    clinicId: number,
    userId: number,
    transaction: Transaction,
  ): Promise<AvailabilityModel[]> {
    const createInput = create.map((dto) => {
      const avModel = {
        clinicId: clinicId,
        createdBy: userId,
        appointmentTypeId: dto.appointmentTypeId,
        doctorId: dto.staffId,
      };

      timeInfoFromDtoToModel(avModel as AvailabilityCreationAttributes, dto.startDate, dto.durationMinutes);
      return avModel as AvailabilityCreationAttributes;
    });

    // TODO fix update failures
    const updateInput = update.map((dto) => {
      const avModel = { id: dto.id, appointmentTypeId: dto.appointmentTypeId, updatedBy: userId, clinicId: clinicId };

      timeInfoFromDtoToModel(avModel as AvailabilityModelAttributes, dto.startDate, dto.durationMinutes);

      return avModel as AvailabilityModelAttributes;
    });

    return AvailabilityModel.bulkCreate([...createInput, ...updateInput], {
      transaction,
      updateOnDuplicate: ['id'],
    });
  }

  findByIds(ids: number[]): Promise<AvailabilityModel[]> {
    this.logger.log({ functionName: this.findByIds.name, ids });
    return this.availabilityRepository.scope('full').findAll({
      where: {
        id: ids,
      },
    });
  }
  /**
   * create or delete availability
   * if there is an id at the create array element thats mean there is update.
   * @param createOrUpdateAvailability
   * @returns created/updated/deleted effected rows.
   */
  // TODO: MMX-S3 check overlaps and duplicates.
  async bulkAction(userId: number, clinicId: number, payload: BulkUpdateAvailabilityDto): Promise<BulkUpdateResult> {
    try {
      return await this.sequelize.transaction(async (transaction: Transaction) => {
        this.logger.log({ payload });
        if (!payload.create.length) {
          payload.create = [];
        }
        if (!payload.update.length) {
          payload.update = [];
        }

        const updatedCreated = this.bulkCreateUpdate(payload.create, payload.update, clinicId, userId, transaction);

        if (payload.remove.length) {
          // TODO don't use await
          await this.bulkRemove(payload.remove, userId, transaction);
        }

        // TODO don't use await
        return {
          created: (await updatedCreated).filter((model) => !model.updatedBy),
          updated: (await updatedCreated).filter((model) => model.updatedBy),
        };
      });
    } catch (error) {
      throw new BadRequestException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }
}

function timeInfoFromDtoToModel(
  avModel: { date: Date; startTime: string; endDate: Date; durationMinutes: number },
  startDate: string,
  durationMinutes: number,
) {
  const isoDate = DateTime.fromISO(startDate);
  // TODO check if we don't have the timezone in the date
  avModel.date = isoDate.toJSDate();
  avModel.startTime = isoDate.toSQLTime({ includeZone: false, includeOffset: false });
  avModel.endDate = isoDate.plus({ minutes: durationMinutes }).toJSDate();
  avModel.durationMinutes = durationMinutes;
}
