import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AvailabilityModel } from './models/availability.model';
import { AVAILABILITY_REPOSITORY } from 'src/common/constants';
import { CreateOrUpdateAvailabilityDto } from './dto/add-or-update-availability.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: typeof AvailabilityModel,
  ) {}

  findAll(): Promise<AvailabilityModel[]> {
    return this.availabilityRepository.findAll();
  }

  createAvailability(data: CreateAvailabilityDto): Promise<AvailabilityModel> {
    // TODO 1- availability must not be overlapped
    return this.availabilityRepository.create(data);
  }

  async deleteAvailability(id: number): Promise<void> {
    try {
      await this.availabilityRepository.update(
        {
          deletedBy: 1,
          deletedAt: new Date(),
        },
        { where: { id } },
      );
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
  // TODO: make interface
  async createOrUpdateAvailability(
    createOrUpdateAvailability: CreateOrUpdateAvailabilityDto,
  ): Promise<any> {
    try {
      this.logger.log({ createOrUpdateAvailability });
      const { add, update, delete: deleteAv } = createOrUpdateAvailability;
      const createdAv =
        add.length && (await this.availabilityRepository.bulkCreate(add));
      const updatedAv =
        update.length &&
        (await this.availabilityRepository.bulkCreate(update, {
          updateOnDuplicate: ['id'],
        }));
      const deletedAv =
        deleteAv.length &&
        deleteAv.map((e: number) => this.deleteAvailability(e));
      return {
        created: createdAv,
        updated: updatedAv,
        deleted: deleteAv,
        deletedAv,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
