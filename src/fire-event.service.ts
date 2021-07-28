import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SERVICE_NAME } from './common/constants';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sqsQueue } = require('pubsub-service');

@Injectable()
export class FireEventService {
  constructor(private eventEmitter: EventEmitter2, private configService: ConfigService) {}

  fireEvent(): void {
    const serviceName = this.configService.get(SERVICE_NAME);
    const topicList = this.configService.get('topicList');
    return sqsQueue.start([{ [serviceName]: topicList }], this.eventEmitter);
  }
}
