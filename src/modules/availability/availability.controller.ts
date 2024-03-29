import { Identity, IIdentity } from '@monmedx/monmedx-common';
import { Body, Controller, Get, Logger, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { CalendarEntriesCountPayloadDto } from 'common/dtos/calendar/calendar-entries-count-payload-dto';
import { CalendarEntriesPayloadDto } from 'common/dtos/calendar/calendar-entries-payload-dto';
import { split } from 'lodash';
import { AvailabilityService } from 'modules/availability/availability.service';
import { AvailabilityValidator } from 'modules/availability/availability.validator';
import { BulkUpdateAvailabilityDto } from 'modules/availability/dto/add-or-update-availability-body.dto';
import { GetSuggestionsDto } from 'modules/availability/dto/GetSuggestionsDto';
import { QueryFindAvailabilityDto } from 'modules/availability/dto/query-find-availability.dto';
import { SearchAvailabilityDto } from 'modules/availability/dto/search-availability-dto';
import { BulkUpdateResult } from 'modules/availability/interfaces/availability-bulk-update.interface';
import { AvailabilityEdgesInterface } from 'modules/availability/interfaces/availability-edges.interface';
import { AvailabilityModel } from 'modules/availability/models/availability.model';

@Controller('availability')
export class AvailabilityController {
  private readonly logger = new Logger(AvailabilityController.name);

  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly validator: AvailabilityValidator,
  ) {}

  @Get()
  // @Permissions(PermissionCode.AVAILABILITY_READ)
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
  // @Permissions(PermissionCode.AVAILABILITY_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.availabilityService.findOne(id);
  }

  @Post('/bulk')
  // @Permissions(PermissionCode.AVAILABILITY_WRITE)
  bulkUpdate(@Identity() identity: IIdentity, @Body() payload: BulkUpdateAvailabilityDto): Promise<BulkUpdateResult> {
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
  // @Permissions(PermissionCode.AVAILABILITY_READ)
  async getAvailabilitySuggestions(
    @Identity() identity: IIdentity,
    @Body() payload: GetSuggestionsDto,
  ): Promise<CalendarEntriesPayloadDto> {
    const entries = await this.availabilityService.getAvailabilitySuggestions(identity, payload);
    return { entries };
  }

  @Post('/search')
  // @Permissions(PermissionCode.AVAILABILITY_READ)
  async searchForAvailabilities(
    @Identity() identity: IIdentity,
    @Body() payload: SearchAvailabilityDto,
  ): Promise<CalendarEntriesPayloadDto> {
    const entries = await this.availabilityService.searchForAvailabilities(identity, payload);
    return { entries };
  }

  @Post('/count')
  // @Permissions(PermissionCode.AVAILABILITY_READ)
  async getAvailabilitiesCount(
    @Identity() identity: IIdentity,
    @Body() payload: SearchAvailabilityDto,
  ): Promise<CalendarEntriesCountPayloadDto> {
    const data = await this.availabilityService.getAvailabilitiesCount(identity, payload);
    return { data };
  }
}
