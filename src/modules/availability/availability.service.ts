import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
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
import { AppointmentTypesLookupsModel } from '../lookups/models/appointment-types.model';
import { ErrorCodes } from 'src/common/enums/error-code.enum';
import * as moment from 'moment';
import { AvailabilityEdgesInterface } from './interfaces/availability-edges.interface';
import { IdentityDto } from '../../common/dtos/identity.dto';

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

  async findNotBookedAvailability(
    availabilityId: number,
  ): Promise<AvailabilityModel> {
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
