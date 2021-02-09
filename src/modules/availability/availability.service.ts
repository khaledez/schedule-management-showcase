import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AvailabilityModel } from './models/availability.model';
import { AVAILABILITY_REPOSITORY, SEQUELIZE } from 'src/common/constants';
import { CreateOrUpdateAvailabilityDto } from './dto/add-or-update-availability.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Transaction } from 'sequelize/types';
import { CreateOrUpdateAvailabilityResponseInterface } from './interfaces/create-or-update-availability-response.interface';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: typeof AvailabilityModel,
    @Inject(SEQUELIZE)
    private readonly sequelize: Sequelize,
  ) {}

  findAll(): Promise<AvailabilityModel[]> {
    return this.availabilityRepository.findAll();
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
      throw new BadRequestException(
        'Error occur while delete bulk availability',
        error,
      );
    }
  }
  /**
   * create or delete availability
   * if there is an id at the create array element thats mean there is update.
   * @param createOrUpdateAvailability
   * @returns created/updated/deleted effected rows.
   */
  // TODO: MMX-S3 check overlaps and duplicates.
  // TODO: MMX-currentSprint add loggers.
  createOrUpdateAvailability(
    createOrUpdateAvailabilityDto: CreateOrUpdateAvailabilityDto,
  ): Promise<CreateOrUpdateAvailabilityResponseInterface> {
    try {
      return this.sequelize.transaction(async (transaction: Transaction) => {
        this.logger.log({ createOrUpdateAvailabilityDto });
        const {
          _delete: deleteAv,
          clinicId,
          userId,
        } = createOrUpdateAvailabilityDto;
        let { create } = createOrUpdateAvailabilityDto;
        // TODO: move out of service to controller.
        if (!create.length && !deleteAv.length) {
          throw new UnprocessableEntityException(
            'create and delete arrays could not be empty at the same time.',
          );
        }

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
      throw new BadRequestException(error.message);
    }
  }
}
