import { IsString, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// this dto for the body comes from the request
// input ModelAppointmentFilterInput {
//   date: ModelDateFilterInput
//   time: ModelTimeFilterInput
//   type: ModelIDFilterInput
//   patientHealthPlanNumber: ModelStringFilterInput
//   patientFullName: ModelStringFilterInput
//   doctorId: ModelIDFilterInput
//   status: ModelIDFilterInput
//   and: [ModelAppointmentFilterInput!]
//   or: [ModelAppointmentFilterInput!]
//   not: ModelAppointmentFilterInput
// }

// TODO: currentSprint
export class AppointmentFilterDto {}
