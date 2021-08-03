import { Identity, IIdentity } from '@dashps/monmedx-common';
import { Body, Controller, Get, Logger, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
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
import { CalendarEntriesPayloadDto } from 'common/dtos/calendar/calendar-entries-payload-dto';

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
    this.logger.debug({ clinicId, userId, payload });
    this.validator.validateBulkUpdateAvailabilityDto(payload);
    return this.availabilityService.bulkAction(identity, payload);
  }

  /**
   * Returns nine suggestions for the next appointment according to the given details
   * @param identity
   * @param payload
   */
  @Post('/suggestions')
  async getAvailabilitySuggestions(
    @Identity() identity: IIdentity,
    @Body() payload: GetSuggestionsDto,
  ): Promise<CalendarEntriesPayloadDto> {
    const suggestions = await this.availabilityService.getAvailabilitySuggestions(identity, payload);
    const responseDto = new CalendarEntriesPayloadDto();
    responseDto.entries = suggestions;
    return responseDto;
  }
}
