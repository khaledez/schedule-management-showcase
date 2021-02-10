import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  BadRequestException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AvailabilityModel } from './models/availability.model';
import { AvailabilityService } from './availability.service';
import { Identity } from 'src/common/decorators/cognitoIdentity.decorator';
import { CreateOrUpdateAvailabilityBodyDto } from './dto/add-or-update-availability-body.dto';
import { CreateOrUpdateAvailabilityResponseInterface } from './interfaces/create-or-update-availability-response.interface';
import { IdentityDto } from 'src/common/dtos/identity.dto';

@Controller('availability')
export class AvailabilityController {
  private readonly logger = new Logger(AvailabilityController.name);

  constructor(private readonly availabilityService: AvailabilityService) {}
  //TODO: MMX-currentSprint add auth guard
  @Get()
  findAll(): Promise<AvailabilityModel[]> {
    return this.availabilityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.availabilityService.findOne(id);
  }

  @Post()
  createOrUpdate(
    @Body()
    createOrUpdateAvailabilityBodyDto: CreateOrUpdateAvailabilityBodyDto,
    @Identity() identity: IdentityDto,
  ): Promise<CreateOrUpdateAvailabilityResponseInterface> {
    const { clinicId, userId } = identity;
    const { create, remove } = createOrUpdateAvailabilityBodyDto;
    this.logger.debug({ clinicId, userId, createOrUpdateAvailabilityBodyDto });
    if (!create.length && !remove.length) {
      throw new BadRequestException(
        'create and remove arrays could not be empty at the same time.',
      );
    }
    return this.availabilityService.createOrUpdateAvailability({
      ...createOrUpdateAvailabilityBodyDto,
      remove: createOrUpdateAvailabilityBodyDto.remove,
      identity,
    });
  }
}
