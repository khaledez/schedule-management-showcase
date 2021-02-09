import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { AvailabilityModel } from './models/availability.model';
import { AvailabilityService } from './availability.service';
import { Identity } from 'src/common/decorators/cognitoIdentity.decorator';
import { IdentityKeysInterface } from 'src/common/interfaces/identity-keys.interface';
import { CreateOrUpdateAvailabilityBodyDto } from './dto/add-or-update-availability-body.dto';
import { CreateOrUpdateAvailabilityResponseInterface } from '../../../dist/src/modules/availability/interfaces/create-or-update-availability-response.interface.d';

@Controller('availability')
export class AvailabilityController {
  private readonly logger = new Logger(AvailabilityController.name);

  constructor(private readonly availabilityService: AvailabilityService) {}
  //TODO: MMX-currentSprint add auth guard
  @Get()
  findAll(): Promise<AvailabilityModel[]> {
    return this.availabilityService.findAll();
  }

  @Post()
  createOrUpdate(
    @Body()
    createOrUpdateAvailabilityBodyDto: CreateOrUpdateAvailabilityBodyDto,
    @Identity() identity: IdentityKeysInterface,
  ): Promise<CreateOrUpdateAvailabilityResponseInterface> {
    const { clinicId, userId } = identity;
    this.logger.debug({ clinicId, userId, createOrUpdateAvailabilityBodyDto });
    return this.availabilityService.createOrUpdateAvailability({
      ...createOrUpdateAvailabilityBodyDto,
      _delete: createOrUpdateAvailabilityBodyDto.delete,
      // TODO: MMX-currentSprint pass identity instead of clinicId/userId
      clinicId,
      userId,
    });
  }
}
