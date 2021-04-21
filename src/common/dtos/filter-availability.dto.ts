import { FilterIdsInputDto } from '@mon-medic/common';

export class FilterAvailabilityInputDto {
  appointmentTypeId?: FilterIdsInputDto;
  appointmentStatusId?: FilterIdsInputDto;
}
