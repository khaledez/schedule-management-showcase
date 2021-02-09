/*  patient view table.*/
"
    CREATE VIEW `patients_view` AS SELECT * FROM patientDB.patient_view 
"
/*
    patient PatientPhoneNumbers with PhoneNumbers
*/
"
    CREATE VIEW `patients_phone_number_view` AS SELECT PATIENT_PHONE_NUMBERS.patient_id, PATIENT_PHONE_NUMBERS.primary, 
    PHONE_NUMBERS.phone_type_code, PHONE_NUMBERS.number FROM patientDB.PatientPhoneNumbers AS PATIENT_PHONE_NUMBERS INNER JOIN 
    patientDB.PhoneNumbers AS PHONE_NUMBERS ON PATIENT_PHONE_NUMBERS.phone_number_id=PHONE_NUMBERS.id WHERE PATIENT_PHONE_NUMBERS.deleted_at IS NULL
"

/*
* patient info with primary health plan
*/
"
    CREATE VIEW `patient_info_view` AS SELECT PATIENT.id AS patient_id, CONCAT(PATIENT.first_name, ' ', PATIENT.last_name) AS full_name, 
    PATIENT.first_name, PATIENT.last_name, PATIENT.dob, PATIENT.created_at, PATIENT.created_by,
    PATIENT.updated_at, PATIENT.updated_by, PATIENT.deleted_at, PATIENT.deleted_by, PATIENT_P_H_P.number
    FROM patientDB.Patients as PATIENT INNER JOIN patientDB.PatientPrimaryHealthPlans AS 
    PATIENT_P_H_P ON PATIENT.id=PATIENT_P_H_P.patient_id WHERE PATIENT.deleted_at IS NULL
"
/*
    combine two views.
*/
"
    CREATE VIEW `patient_view` AS SELECT PATIENT_INFO_VIEW.patient_id AS id, CONCAT(PATIENT_INFO_VIEW.first_name, ' ', PATIENT_INFO_VIEW.last_name) AS full_name, PATIENT_INFO_VIEW.dob, PATIENT_INFO_VIEW.created_at, PATIENT_INFO_VIEW.created_by,
    PATIENT_INFO_VIEW.updated_at, PATIENT_INFO_VIEW.updated_by, PATIENT_INFO_VIEW.deleted_at, PATIENT_INFO_VIEW.deleted_by, PATIENT_PHONE_VIEW_NUMBERS.primary, 
    PATIENT_PHONE_VIEW_NUMBERS.phone_type_code, PATIENT_PHONE_VIEW_NUMBERS.number FROM patientDB.patient_info_view as PATIENT_INFO_VIEW INNER JOIN 
    patientDB.patients_phone_number_view AS PATIENT_PHONE_VIEW_NUMBERS ON PATIENT_INFO_VIEW.patient_id=PATIENT_PHONE_VIEW_NUMBERS.patient_id 
"