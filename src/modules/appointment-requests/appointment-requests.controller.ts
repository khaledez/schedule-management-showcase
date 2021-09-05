import { Public, TransactionInterceptor, TransactionParam } from '@monmedx/monmedx-common';
import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { AppointmentRequestsService } from './appointment-requests.service';
import { EmptyDto } from './dto';

@Controller('empty')
export class AppointmentRequestsController {
  constructor(private readonly emptyService: AppointmentRequestsService) {}

  @Public()
  @UseInterceptors(TransactionInterceptor)
  @Post()
  create(@TransactionParam() transaction: Transaction, @Body() emptyDto: EmptyDto) {
    return this.emptyService.create(emptyDto, transaction);
  }
}
