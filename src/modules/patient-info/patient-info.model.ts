import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript';

export interface PatientInfoAttributes {
  id: number;
  clinicId: number;
  fullName: string;
  primaryHealthPlanNumber: string;
  dob: string;
  statusCode: string;
  doctorId?: number;
  legacyId?: string;
  userId?: number;
  displayPatientId?: string;
}

/**
 * Patient info is not the concern of schedule management componenet.
 * However, we have a use case where we need to search patients and appointments in the same query.
 * In order to decouple the two services (patient-management and schedule-management) we opted with creating
 * this table to duplicate patient info data to support this query.
 *
 * In order to make sure the data here is always in sync with patient-management, we implement the following:
 * - when patient info gets updated, patient-management to publish an event we consume and update this table.
 */
@Table({ tableName: 'PatientInfo', underscored: true, paranoid: false })
export class PatientInfoModel
  extends Model<PatientInfoAttributes, PatientInfoAttributes>
  implements PatientInfoAttributes
{
  @PrimaryKey
  @Column
  id: number;

  @Column
  clinicId: number;

  @Column
  doctorId: number;

  @Column
  fullName: string;

  @Column
  primaryHealthPlanNumber: string;

  @Column
  dob: string;

  @Column
  statusCode: string;

  @Column
  legacyId: string;

  @Column
  userId: number;

  @Column
  displayPatientId: string;
}
