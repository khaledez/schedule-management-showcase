import { AppointmentTypesLookupsModel } from 'modules/lookups/models/appointment-types.model';

export function initAppointmentTypeRepo(): Array<AppointmentTypesLookupsModel> {
  const prototype = AppointmentTypesLookupsModel.prototype;
  return [
    Object.assign(Object.create(prototype), { id: 1, nameEn: 'typeA' }),
    Object.assign(Object.create(prototype), { id: 2, nameEn: 'typeB' }),
    Object.assign(Object.create(prototype), { id: 3, nameEn: 'typeC' }),
  ];
}
