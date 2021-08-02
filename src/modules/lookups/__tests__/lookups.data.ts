import { AppointmentTypesLookupsModel } from 'modules/lookups/models/appointment-types.model';
import { AppointmentStatusLookupsModel } from '../models/appointment-status.model';
import { AppointmentVisitModeLookupModel } from '../models/appointment-visit-mode.model';

export function appointmentTypesLookupData(): Array<AppointmentTypesLookupsModel> {
  const prototype = AppointmentTypesLookupsModel.prototype;
  return [
    Object.assign(Object.create(prototype), { id: 1, nameEn: 'typeA' }),
    Object.assign(Object.create(prototype), { id: 2, nameEn: 'typeB' }),
    Object.assign(Object.create(prototype), { id: 3, nameEn: 'typeC' }),
  ];
}

export function appointmentStatusLookupData(): AppointmentStatusLookupsModel[] {
  const prototype = AppointmentStatusLookupsModel.prototype;

  return [
    Object.assign(Object.create(prototype), { id: 1, nameEn: 'wait list', code: 'WAITLIST' }),
    Object.assign(Object.create(prototype), { id: 2, nameEn: 'scheduled', code: 'SCHEDULE' }),
    Object.assign(Object.create(prototype), { id: 3, nameEn: 'confirm', code: 'CONFIRM' }),
    Object.assign(Object.create(prototype), { id: 4, nameEn: 'check in', code: 'CHECK_IN' }),
    Object.assign(Object.create(prototype), { id: 5, nameEn: 'complete', code: 'COMPLETE' }),
    Object.assign(Object.create(prototype), { id: 6, nameEn: 'cancelled', code: 'CANCELED' }),
  ];
}

export function appointmentVisitModeLookupData(): AppointmentVisitModeLookupModel[] {
  const prototype = AppointmentVisitModeLookupModel.prototype;

  return [
    Object.assign(Object.create(prototype), { id: 1, nameEn: 'In Person', code: 'IN_PERSON' }),
    Object.assign(Object.create(prototype), { id: 2, nameEn: 'Virtual', code: 'VIRTUAL' }),
    Object.assign(Object.create(prototype), { id: 3, nameEn: 'Phone', code: 'PHONE' }),
  ];
}
