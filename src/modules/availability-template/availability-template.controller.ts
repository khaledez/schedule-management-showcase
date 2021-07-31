import { Identity, IIdentity } from '@dashps/monmedx-common';
import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { AvailabilityTemplateService } from './availability-template.service';
import { AvailabilitySlotDto } from './dto/availability-template-slot.dto';
import { AvailabilityTemplateDto } from './dto/availability-template.dto';
import { CreateAvailabilityTemplateDto } from './dto/create-template-dto';
import { DeleteTemplateDto } from './dto/delete-template.dto';
import { AvailabilityTemplateResult } from './interfaces/availability-template.interface';

@Controller('availability-templates')
export class AvailabilityTemplateController {
  constructor(private readonly templateService: AvailabilityTemplateService) {}
  /**
   * @description Creates a new AvailabilityTemplate in database
   * @param body Must contain all AvailabilityTemplateDto, with availability_group_ids as a stringified json array
   * @returns AvailabilityTemplate or Empty array []
   * @throws 401, Possible reasons: Cannot connect to db, Model uninitialized
   */
  @Post()
  createAvailbailityTemplate(
    @Identity() identity: IIdentity,
    @Body() payload: CreateAvailabilityTemplateDto,
  ): Promise<AvailabilityTemplateResult> {
    // Map payload to service attributes

    const { userId, clinicId } = identity;
    // Add createdBy and clinicId to slots
    const availabilitySlots: AvailabilitySlotDto[] = payload.availabilitySlots.map((slot) => ({
      ...slot,
      createdBy: userId,
      clinicId: clinicId,
    }));
    const dto: AvailabilityTemplateDto = {
      name: payload.name,
      createdBy: identity.userId,
      clinicId: identity.clinicId,
      availabilitySlots,
    };
    return this.templateService.createAvailabilityTemplate(dto);
  }

  /**
   * @description Uses MySQL Like operator to search templates by name
   * @param name Name of template
   * @returns Zero or more populated AvailabilityTemplate objects
   * @throws 401, Possible reasons: Cannot connect to db, Model uninitialized
   */
  @Get()
  searchTemplatesByName(@Identity() identity, @Query() { query }): Promise<AvailabilityTemplateResult> {
    return this.templateService.getAvailabilityTemplatesByName(identity.clinicId, query);
  }

  /**
   *
   * @param body Contains an array of ids
   * @returns Nothing on success
   */
  @Delete()
  deleteTemplatesByFilter(@Body() body: DeleteTemplateDto): Promise<void> {
    return this.templateService.deleteAvailabilityTemplatesByIds(body.ids);
  }
}
