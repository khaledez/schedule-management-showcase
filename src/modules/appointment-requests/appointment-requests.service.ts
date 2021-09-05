import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { EmptyDto } from './dto';

@Injectable()
export class AppointmentRequestsService {
  private readonly logger = new Logger(AppointmentRequestsService.name);

  constructor() {}

  /**
   * create description
   * @param emptyDto
   * @param transaction
   */
  create(emptyDto: EmptyDto, transaction: Transaction) {
    this.logger.log({ function: 'create', emptyDto });

    return emptyDto;
  }
}
