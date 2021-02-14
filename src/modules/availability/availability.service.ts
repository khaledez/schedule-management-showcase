import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { AvailabilityModel } from './models/availability.model';
import { AVAILABILITY_REPOSITORY, SEQUELIZE } from 'src/common/constants';
import { CreateOrUpdateAvailabilityDto } from './dto/add-or-update-availability.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Transaction } from 'sequelize/types';
import { CreateOrUpdateAvailabilityResponseInterface } from './interfaces/create-or-update-availability-response.interface';
import { raw } from 'express';
import { AppointmentTypesLookupsModel } from '../lookups/models/appointment-types.model';
import { ErrorCodes } from 'src/common/enums/error-code.enum';
import * as moment from 'moment';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: typeof AvailabilityModel,
    @Inject(SEQUELIZE)
    private readonly sequelize: Sequelize,
  ) {}

  calculateEndTime(time: string, durationMin: number): string {
    const timeFormat = 'hh:mm:ss';
    return moment(time, timeFormat)
      .add(durationMin, 'minutes')
      .format(timeFormat);
  }

  findAll(): Promise<any> {
    const availability = this.availabilityRepository.findAll({
      include: [
        {
          model: AppointmentTypesLookupsModel,
          as: 'type',
        },
      ],
    });
    const availabilityAsPlain = availability.map((e) => e.get({ plain: true }));

    return availabilityAsPlain.map((e: AvailabilityModel) => ({
      ...e,
      endTime: this.calculateEndTime(e.startTime, e.durationMinutes),
    }));
  }

  async findOne(id: number): Promise<any> {
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
    const availabilityPlain = availability.get({ plain: true });
    const { startTime, durationMinutes } = availability;
    return {
      ...availabilityPlain,
      endTime: this.calculateEndTime(startTime, durationMinutes),
    };
  }

  createAvailability(data: CreateAvailabilityDto): Promise<AvailabilityModel> {
    // TODO 1- availability must not be overlapped
    return this.availabilityRepository.create(data);
  }
  /**
   *
   * @param ids array of availability ids to be deleted
   *
   */
  async deleteBulkAvailability(
    ids: Array<number>,
    userId: number,
    transaction: Transaction,
  ): Promise<Array<number>> {
    try {
      this.logger.debug({ ids });
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
  /**
   * create or delete availability
   * if there is an id at the create array element thats mean there is update.
   * @param createOrUpdateAvailability
   * @returns created/updated/deleted effected rows.
   */
  // TODO: MMX-S3 check overlaps and duplicates.
  createOrUpdateAvailability(
    createOrUpdateAvailabilityDto: CreateOrUpdateAvailabilityDto,
  ): Promise<CreateOrUpdateAvailabilityResponseInterface> {
    try {
      return this.sequelize.transaction(async (transaction: Transaction) => {
        this.logger.log({ createOrUpdateAvailabilityDto });

        const { remove: deleteAv, identity } = createOrUpdateAvailabilityDto;
        const { clinicId, userId } = identity;
        let { create } = createOrUpdateAvailabilityDto;

        // add clinicId, createdBy at the availability object.
        if (create.length) {
          create = create.map(
            (e): CreateAvailabilityDto => {
              e.clinicId = clinicId;
              e.createdBy = userId;
              return e;
            },
          );
        }

        const createdAv = create.length
          ? await this.availabilityRepository.bulkCreate(create, {
              updateOnDuplicate: ['id'],
              transaction,
            })
          : null;

        const deletedAv = deleteAv.length
          ? await this.deleteBulkAvailability(deleteAv, userId, transaction)
          : null;
        return {
          created: createdAv,
          deleted: deletedAv,
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
