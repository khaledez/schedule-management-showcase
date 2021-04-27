import { Controller, Get, Post, Body, Logger, BadRequestException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { Identity } from '@dashps/monmedx-common';
import { CreateOrUpdateAvailabilityBodyDto } from './dto/add-or-update-availability-body.dto';
import { CreateOrUpdateAvailabilityResponseInterface } from './interfaces/create-or-update-availability-response.interface';
import { IdentityDto } from 'src/common/dtos/identity.dto';
import { ErrorCodes } from 'src/common/enums/error-code.enum';
import { AvailabilityEdgesInterface } from './interfaces/availability-edges.interface';
import { split } from 'lodash';
import { QueryFindAvailabilityDto } from './dto/query-find-availability.dto';
import { AvailabilityModel } from './models/availability.model';

@Controller('availability')
export class AvailabilityController {
  private readonly logger = new Logger(AvailabilityController.name);

  constructor(private readonly availabilityService: AvailabilityService) {}
  //TODO: MMX-currentSprint add auth guard
  @Get()
  findAll(
    @Identity() identity: IdentityDto,
    @Query() query?: QueryFindAvailabilityDto,
  ): Promise<AvailabilityEdgesInterface> | Promise<AvailabilityModel[]> {
    if (query.ids) {
      const ids = split(query.ids, ',').map((ele: string) => ~~ele);
      return this.availabilityService.findByIds(ids);
    }
    this.logger.debug({ identity });
    return this.availabilityService.findAll({
      identity,
    });
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
      throw new BadRequestException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'create and remove arrays could not be empty at the same time.',
      });
    }
    return this.availabilityService.createOrUpdateAvailability({
      ...createOrUpdateAvailabilityBodyDto,
      remove: createOrUpdateAvailabilityBodyDto.remove,
      identity,
    });
  }
}
