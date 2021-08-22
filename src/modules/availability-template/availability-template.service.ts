import { IIdentity } from '@dashps/monmedx-common';
import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { AVAILABILITY_TEMPLATE_REPOSITORY, BAD_REQUEST } from 'common/constants';
import { ErrorCodes } from 'common/enums/error-code.enum';
import { LookupsService } from 'modules/lookups/lookups.service';
import { Op, WhereOptions } from 'sequelize';
import { AvailabilityTemplateDto } from './dto/availability-template.dto';
import { AvailabilityTemplateResult } from './interfaces/availability-template.interface';
import { AvailabilityTemplateSlotModel } from './model/availability-template-slot.model';
import { AvailabilityTemplateModel } from './model/availability-template.model';

@Injectable()
export class AvailabilityTemplateService {
  private readonly logger = new Logger(AvailabilityTemplateService.name);
  constructor(
    @Inject(AVAILABILITY_TEMPLATE_REPOSITORY)
    private readonly templateRepository: typeof AvailabilityTemplateModel,
    private readonly lookupsService: LookupsService,
  ) {}
  /**
   * Adds new availabililty template to table, createdBy, clinicId is populated user's id
   * @param payload [name, userId, clinicId, array of AvailabilitySlot objects]
   * @returns Promise that resolves to added Template
   */
  async createAvailabilityTemplate(
    identity: IIdentity,
    payload: AvailabilityTemplateDto,
  ): Promise<AvailabilityTemplateResult> {
    // Validate if slot appointment type
    await this.lookupsService.validateAppointmentsTypes(
      identity,
      payload.availabilitySlots.map((s) => s.appointmentTypeId),
    );
    try {
      // Creates nested slots automatically
      const templates = [];
      templates.push(await this.templateRepository.create(payload, { include: AvailabilityTemplateSlotModel }));
      return { templates };
    } catch (error) {
      this.logger.error({ code: ErrorCodes.INTERNAL_SERVER_ERROR, function: 'createAvailabilityTemplate', error });
      throw new InternalServerErrorException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'Could not add template or slots to database',
      });
    }
  }

  /**
   * Returns templates by name search, or all templates if query not defined
   * @param input name?: search key of AvialabilityTemplate, clinicId: corresponding clinic
   * @returns Promise that resolves to zero-multiple AvailabilityTemplates
   */
  async getAvailabilityTemplatesByName(clinicId: number, name?: string): Promise<AvailabilityTemplateResult> {
    let whereConditions: WhereOptions<AvailabilityTemplateModel> = {
      clinicId,
    };

    if (name) {
      whereConditions = { ...whereConditions, name: { [Op.like]: `%${name}%` } };
    }

    try {
      // Find objects
      const templates = await this.templateRepository.findAll({
        where: whereConditions,
        include: {
          model: AvailabilityTemplateSlotModel,
          required: true,
        },
      });
      // Return empty object if none existent
      if (!templates && templates.length === 0) {
        return {};
      }
      return { templates };
    } catch (error) {
      this.logger.error({ code: ErrorCodes.INTERNAL_SERVER_ERROR, function: 'getAvailabilityTemplatesByName', error });
      throw new InternalServerErrorException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: "Couldn't access AvailabilityTemplate or AvailabilityGroup repositories",
      });
    }
  }

  /**
   * Hard delete templates and thier corresponding slots
   * @param identity
   * @param ids One or more ids to delete
   * @returns Nothing on success
   */
  async deleteAvailabilityTemplatesByIds(ids: number[]) {
    // Validate ids exist
    if (!ids || ids.length === 0) {
      throw new BadRequestException({ code: BAD_REQUEST, message: 'No ids were provided' });
    }
    // Hard delete template
    // Cascades on slots
    try {
      await this.templateRepository.destroy({
        where: {
          id: {
            [Op.in]: ids,
          },
        },
      });
    } catch (error) {
      this.logger.error({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        function: 'deleteAvailabilityTemplatesByIds',
        error,
      });
      throw new InternalServerErrorException({
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: "Couldn't reach AvailabiltyTemplate repository",
      });
    }
    return;
  }
}
