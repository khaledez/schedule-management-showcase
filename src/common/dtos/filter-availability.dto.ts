import { FilterIdsInputDto } from '@mon-medic/common';

export class FilterAvailabilityInputDto {
  appointmentTypeId?: FilterIdsInputDto;
  withAppointment?: boolean;
}
