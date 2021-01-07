import { Injectable, Inject } from '@nestjs/common';
import { APPOINTMENTS_REPOSITORY } from '../../common/constants/index';
import { AppointmentsModel } from './models/appointments.model';

@Injectable()
export class AppointmentsService {
    constructor(
        @Inject(APPOINTMENTS_REPOSITORY)
        private readonly appoitmentsRepo: typeof AppointmentsModel
    ){}

    findAll() {
        return this.appoitmentsRepo.findAll();
    }
}
