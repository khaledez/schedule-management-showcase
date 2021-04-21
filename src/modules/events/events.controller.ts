import { Identity, IIdentity } from '@mon-medic/common';
import { Body, Controller, Delete, Get, Logger, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { EventCreateDto, EventUpdateDto } from './events.dto';
import { EventDeleteResponse, EventMutateResponse, EventReadResponse } from './events.interfaces';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventsSvc: EventsService) {}

  @Post()
  async create(@Identity() identity: IIdentity, @Body() payload: EventCreateDto): Promise<EventMutateResponse> {
    try {
      return { event: await this.eventsSvc.create(identity, payload) };
    } catch (error) {
      // TODO better support for errors
      return { errors: [{ message: error.message, code: error.name, fields: [] }] };
    }
  }

  @Patch(':id')
  async update(
    @Identity() identity: IIdentity,
    @Param('id') id: number,
    @Body() payload: EventUpdateDto,
  ): Promise<EventMutateResponse> {
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
