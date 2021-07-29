import { BaseModelAttributes } from 'common/models';
import { CreateSlotAttributes } from '../dto/create-slot.dto';

/**
 * Interface to define attributes availability template
 * [ id, clinicId, created/updated/deleted ] are inherited from BaseModelAttributes
 */
export interface AvailabilityTemplateAttributes extends BaseModelAttributes {
  name: string;
  availabilitySlots: CreateSlotAttributes[];
}
