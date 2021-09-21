import { BadRequestException, Injectable } from '@nestjs/common';
import { BAD_REQUEST } from 'common/constants';
import { ErrorCodes } from 'common/enums';
import { ValidatorBase } from 'common/validation/validator-base';
import { BulkUpdateAvailabilityDto } from 'modules/availability/dto/add-or-update-availability-body.dto';
import { CreateAvailabilityDto } from 'modules/availability/dto/create.dto';
import { UpdateAvailabilityDto } from 'modules/availability/dto/update.dto';

@Injectable()
export class AvailabilityValidator extends ValidatorBase {
  /**
   * Validates availability bulk actions
   */
  validateBulkUpdateAvailabilityDto(payload: BulkUpdateAvailabilityDto) {
    const { create, delete: remove, update } = payload;
    if (!create.length && !remove.length && !update.length) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_INPUT,
        message: 'At least one operation must be provided',
      });
    }
    this.assertArrayElementsType(create, CreateAvailabilityDto, 'Invalid availability objects');
    this.assertNoSharedIds(remove, update);
    this.assertNoIdDuplicates(update);
  }

  /**
   * Make sure no conflicts between updated availabilities and deleted ones
   */
  assertNoSharedIds(remove: Array<number>, update: Array<UpdateAvailabilityDto>) {
    if (update?.filter((updReq) => remove?.includes(updReq.id))?.length > 0) {
      throw new BadRequestException({
        fields: [],
        code: BAD_REQUEST,
        message: 'You cannot update & delete the same record in the same time',
      });
    }
  }

  /**
   * Check payload doesn't have two updates or more for the same object id
   */
  assertNoIdDuplicates(update: Array<UpdateAvailabilityDto>) {
    const uniqueIds = new Set(update?.map((updReq) => updReq.id));
    if (uniqueIds.size > 0 && update?.length !== uniqueIds.size) {
      throw new BadRequestException({
        fields: [],
        code: BAD_REQUEST,
        message: 'duplicate entries in the update list',
      });
    }
  }
}
