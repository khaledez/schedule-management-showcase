import { Controller, Get } from '@nestjs/common';

@Controller('appointments')
export class AppointmentsController {
    @Get()
    findAll(){ 
        
    }
}
