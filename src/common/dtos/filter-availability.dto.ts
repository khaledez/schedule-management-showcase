import { FilterIdsInputDto } from '@dashps/monmedx-common';

export class FilterAvailabilityInputDto {
  appointmentTypeId?: FilterIdsInputDto;
  withAppointment?: boolean;
}
