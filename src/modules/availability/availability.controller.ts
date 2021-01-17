import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  MethodNotAllowedException,
} from '@nestjs/common';
import { AvailabilityModel } from './models/availability.model';
import { AvailabilityService } from './availability.service';
import { CreateOrUpdateAvailabilityDto } from './dto/add-or-update-availability.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  findAll(): Promise<AvailabilityModel[]> {
    return this.availabilityService.findAll();
  }

  @Get('doctors')
  findAvailability(): Promise<AvailabilityModel[]> {
    return this.availabilityService.findAll();
  }

  @Post('doctors/:doctorId')
  createOrUpdate(
    @Body() createOrUpdateAvailabilityDto: CreateOrUpdateAvailabilityDto,
    @Param() params: any, // TODO: add param interface
    @Headers() headers: Headers,
  ): Promise<AvailabilityModel> {
    const clinic_id: string = headers['x-mmx-clinic-id'];
    const user_id: string = headers['x-mmx-user-id'];
    console.log({
      clinic_id,
      user_id,
      headers,
    });

    if (!clinic_id || !user_id)
      throw new MethodNotAllowedException(
        'ClinicId and userId could not be null or undefined',
      );

    const modifiedAddArray: Array<CreateAvailabilityDto> = createOrUpdateAvailabilityDto.add.map(
      (e: CreateAvailabilityDto) => ({
        ...e,
        doctor_id: Number(params.doctorId),
        clinic_id: Number(clinic_id),
        created_by: Number(user_id),
      }),
    );
    return this.availabilityService.createOrUpdateAvailability({
      ...createOrUpdateAvailabilityDto,
      add: modifiedAddArray,
    });
  }
}
