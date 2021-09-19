export class AvailabilityEventPayload {
  eventName: string;
  changeType: string;
  source: string;
  clinicId: number;
  triggeringMMXUser: number;
  doctorsAffected: number[];
  availability: AvailabilityPayload;
}

export interface AvailabilityPayload {
  id: number;
  availability: AvailabilityPayloadData;
  availabilityBeforeUpdate?: AvailabilityPayloadData;
}

export interface AvailabilityPayloadData {
  staffId?: number;
  startDate?: Date;
  durationMinutes?: number;
  isOccupied?: boolean;
}
