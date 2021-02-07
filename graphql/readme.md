Merge files:
appointment: graphql-schema-utilities -s "{./reference.graphql,./appointment.graphql,./root.graphql}" -o "./appointment-all.graphql"
patient: graphql-schema-utilities -s "{./reference.graphql,./patient.graphql,./root.graphql}" -o "./patient-all.graphql"
global schema: graphql-schema-utilities -s "{./reference.graphql,./root.graphql,./patient/patient.graphql,./appointment/appointment.graphql}" -o "./monmedic.graphql"

Upload schema to appsync:
aws appsync start-schema-creation --api-id <app_id> --definition <base64>
check upload satus:
aws appsync get-schema-creation-status --api-id <app_id>