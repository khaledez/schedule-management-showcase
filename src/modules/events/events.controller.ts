import { Identity, IIdentity } from '@dashps/monmedx-common';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { BAD_REQUEST } from 'src/common/constants';
import { EventCreateDto, EventUpdateDto } from './events.dto';
import { EventDeleteResponse, EventMutateResponse, EventReadResponse } from './events.interfaces';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventsSvc: EventsService) {}

  @Post()
  async create(@Identity() identity: IIdentity, @Body() payload: EventCreateDto): Promise<EventMutateResponse> {
    validateDateInput(payload);
    return { event: await this.eventsSvc.create(identity, payload) };
  }

  @Patch(':id')
  async update(
    @Identity() identity: IIdentity,
    @Param('id') id: number,
    @Body() payload: EventUpdateDto,
  ): Promise<EventMutateResponse> {
    validateDateInput(payload);
    try {
      payload.id = id;
      return { event: await this.eventsSvc.update(identity, payload) };
    } catch (error) {
      // TODO better support for errors
      return { errors: [{ message: error.message, code: error.name, fields: [] }] };
    }
  }

  @Delete(':id')
  async delete(@Identity() identity: IIdentity, @Param('id') id: number): Promise<EventDeleteResponse> {
    try {
      await this.eventsSvc.remove(identity, id);
      return {};
    } catch (error) {
      return { errors: [{ message: error.message, code: error.name, fields: [] }] };
    }
  }

  @Get(':id')
  async readOne(@Identity() identity: IIdentity, @Param('id') id: number): Promise<EventReadResponse> {
    const event = await this.eventsSvc.findOne(id);
    if (!event) {
      throw new NotFoundException({
        fields: ['id'],
        code: 'NOT_FOUND',
        message: `event with id = '${id}' doesn't exist`,
      });
    }
    return { event };
  }
}

function validateDateInput(payload: EventCreateDto) {
  if (!payload?.startDate || !payload.durationMinutes) {
    throw new BadRequestException({
      fields: ['startDate', 'durationMinutes'],
      code: BAD_REQUEST,
      message: 'you need to specify startDate & durationMinutes',
    });
  }
}
