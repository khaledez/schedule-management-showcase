/* TODO: make sure thats works well with the relation.*/
/* TODO: make the migration. */
/* patient info with joins need enhanve*/
"
    CREATE VIEW `patient_information_view` AS SELECT PATIENT.id as patient_id, CONCAT(PATIENT.first_name, ' ', PATIENT.last_name) AS full_name,
    PATIENT.first_name, PATIENT.last_name, PATIENT.dob, PATIENT_PHONE_NUMBERS.phone_number_id, PATIENT_PHONE_NUMBERS.primary, 
    PHONE_NUMBERS.phone_type_code, PHONE_NUMBERS.number, PATIENT_P_H_P.number AS RAMQ FROM patientDB.Patients AS PATIENT
    INNER JOIN patientDB.PatientPhoneNumbers AS PATIENT_PHONE_NUMBERS ON PATIENT.id=PATIENT_PHONE_NUMBERS.patient_id 
    INNER JOIN patientDB.PhoneNumbers AS PHONE_NUMBERS ON PATIENT_PHONE_NUMBERS.phone_number_id = PHONE_NUMBERS.id
    LEFT JOIN patientDB.PatientPrimaryHealthPlans AS PATIENT_P_H_P ON PATIENT.id=PATIENT_P_H_P.patient_id
"

"
    CREATE VIEW `appointment_patient_view` AS 
    SELECT APPT.id, APPT.date, APPT.provisional_date, APPT.appointment_type_id, APPT.doctor_id, APPT.clinic_id,
    APPT.appointment_status_id, APPT.created_at, APPT.created_by, 
    PATIENT.id as patient_id, PATIENT.first_name, PATIENT.last_name, PATIENT.dob 
    FROM scheduleDB.Appointments as APPT INNER JOIN patientDB.Patients as PATIENT 
    ON APPT.patient_id=PATIENT.id WHERE APPT.upcoming_appointment=1;
"

/* simple patient view table.*/
"
    CREATE VIEW `patients_view` AS 
    SELECT PATIENT.id, PATIENT.clinic_id, PATIENT.first_name, PATIENT.last_name, PATIENT.dob, PATIENT.created_at, PATIENT.created_by,
    PATIENT.updated_at, PATIENT.updated_by, PATIENT.deleted_at, PATIENT.deleted_by
    FROM patientDB.Patients as PATIENT 
"