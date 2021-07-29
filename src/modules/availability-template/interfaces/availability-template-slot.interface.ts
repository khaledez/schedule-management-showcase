import { BaseModelAttributes } from 'common/models';

/**
 * Interface to define attributes availability template
 * [ id, clinicId, created/updated/deleted ] are inherited from BaseModelAttributes
 * @note availability_group_ids is an array of ids but saved as a Sequelize.JSON in database
 */
export interface AvailabilitySlotAttributes extends BaseModelAttributes {
  availabilityTemplateId?: number; // Should be auto-generated on creation
  appointmentTypeId: number;
  startTime: string;
  durationMinutes: number;
}
