import { ResultWithErrors } from '../../common/dtos/result-with-errors.dto';
import { EventModel } from './models';

export interface Invitee {
  email: string;
}

export interface EventUpdateRequest {
  id: number;
  title?: string;
  invitees?: Invitee[];
  location?: string;
  colorCode?: string;
  // startDate is the main field, date is kept for backwards compatibility
  startDate: Date;
  date?: Date; // deprecated
  startTime?: string; // deprecated
  endDate?: Date; // deprecated
  endTime?: string; // deprecated
  durationMinutes?: number;
  descriptionRich?: string;
  staffId: number;
}

export type EventCreateRequest = Omit<EventUpdateRequest, 'id'>;

export type EventDeleteResponse = ResultWithErrors;

export interface EventMutateResponse extends ResultWithErrors {
  event?: EventModel;
}

export type EventReadResponse = EventMutateResponse;
