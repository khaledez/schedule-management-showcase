import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  MethodNotAllowedException,
  Logger,
} from '@nestjs/common';
import { AvailabilityModel } from './models/availability.model';
import { AvailabilityService } from './availability.service';
import { CreateOrUpdateAvailabilityDto } from './dto/add-or-update-availability.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

@Controller('availability')
export class AvailabilityController {
  private readonly logger = new Logger(AvailabilityController.name);

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
    const clinicId: string = headers['x-mmx-clinic-id'];
    const userId: string = headers['x-mmx-user-id'];
    this.logger.log({
      clinicId,
      userId,
      headers,
    });

    if (!clinicId || !userId) {
      throw new MethodNotAllowedException(
        'ClinicId and userId could not be null or undefined',
      );
    }

    const modifiedAddArray: Array<CreateAvailabilityDto> = createOrUpdateAvailabilityDto.add.map(
      (e: CreateAvailabilityDto) => ({
        ...e,
        doctorId: Number(params.doctorId),
        clinicId: Number(clinicId),
        createdBy: Number(userId),
      }),
    );
    return this.availabilityService.createOrUpdateAvailability({
      ...createOrUpdateAvailabilityDto,
      add: modifiedAddArray,
    });
  }
}
