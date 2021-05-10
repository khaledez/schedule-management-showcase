import { Controller, Get, Post, Body, Logger, BadRequestException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { Identity, IIdentity } from '@dashps/monmedx-common';
import { BulkUpdateAvailabilityDto } from './dto/add-or-update-availability-body.dto';
import { BulkUpdateResult } from './interfaces/availability-bulk-update.interface';
import { ErrorCodes } from 'src/common/enums/error-code.enum';
import { AvailabilityEdgesInterface } from './interfaces/availability-edges.interface';
import { split } from 'lodash';
import { QueryFindAvailabilityDto } from './dto/query-find-availability.dto';
import { AvailabilityModel } from './models/availability.model';

@Controller('availability')
export class AvailabilityController {
  private readonly logger = new Logger(AvailabilityController.name);

  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  findAll(
    @Identity() identity: IIdentity,
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

  @Post('/bulk')
  bulkUpdate(
    @Body()
    payload: BulkUpdateAvailabilityDto,
    @Identity() identity: IIdentity,
  ): Promise<BulkUpdateResult> {
    const { clinicId, userId } = identity;
    const { create, remove, update } = payload;
    this.logger.debug({ clinicId, userId, payload });

    if (!create.length && !remove.length && !update.length) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_INPUT,
        message: 'At least one operation must be provided',
      });
    }

    return this.availabilityService.bulkAction(identity, payload);
  }
}
