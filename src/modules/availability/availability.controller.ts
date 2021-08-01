import { Identity, IIdentity } from '@dashps/monmedx-common';
import { BadRequestException, Body, Controller, Get, Logger, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ErrorCodes } from 'common/enums/error-code.enum';
import { split } from 'lodash';
import { AvailabilityService } from 'modules/availability/availability.service';
import { AvailabilityValidator } from 'modules/availability/availability.validator';
import { BulkUpdateAvailabilityDto } from 'modules/availability/dto/add-or-update-availability-body.dto';
import { GetSuggestionsDto } from 'modules/availability/dto/GetSuggestionsDto';
import { QueryFindAvailabilityDto } from 'modules/availability/dto/query-find-availability.dto';
import { BulkUpdateResult } from 'modules/availability/interfaces/availability-bulk-update.interface';
import { AvailabilityEdgesInterface } from 'modules/availability/interfaces/availability-edges.interface';
import { AvailabilityModel } from 'modules/availability/models/availability.model';
import { CreateAvailabilityGroupBodyDto } from './dto/create-availability-group-body.dto';
import { AvailabilityModelAttributes } from './models/availability.interfaces';

@Controller('availability')
export class AvailabilityController {
  private readonly logger = new Logger(AvailabilityController.name);

  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly validator: AvailabilityValidator,
  ) {}

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

  /**
   * Returns nine suggestions for the next appointment according to the given details
   * @param identity
   * @param payload
   */
  @Post('/suggestions')
  getAvailabilitySuggestions(
    @Identity() identity: IIdentity,
    @Body() payload: GetSuggestionsDto,
  ): Promise<AvailabilityModelAttributes[]> {
    return this.availabilityService.getAvailabilitySuggestions(identity, payload);
  }
  @Post('/create-group')
  createAvailabilityGroup(
    @Body() payload: CreateAvailabilityGroupBodyDto,
    @Identity() identity: IIdentity,
  ): Promise<Array<AvailabilityModelAttributes>> {
    this.validator.validateCreateAvailabilityGroup(payload);
    return this.availabilityService.createAvailabilityGroup(payload, identity);
  }
}
