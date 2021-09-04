#!/bin/sh
export clusterName=$(aws cloudformation describe-stacks --stack-name $CLOUDFORMATION_STACK_NAME --output text --query "Stacks[0].Outputs[?OutputKey=='clusterName'].OutputValue" )
export DB_HOST=$(aws cloudformation describe-stacks --stack-name $CLOUDFORMATION_STACK_NAME --output text --query "Stacks[0].Outputs[?OutputKey=='dbClusterEndpoint'].OutputValue" )
export MYSQL_PASSWORD_PARAMETER=$(aws cloudformation describe-stacks --stack-name $CLOUDFORMATION_STACK_NAME --output text --query "Stacks[0].Outputs[?OutputKey=='MYSQLPASSWORDPARAMETER'].OutputValue" )
export restApiId=$(aws cloudformation describe-stacks --stack-name $CLOUDFORMATION_STACK_NAME --output text --query "Stacks[0].Outputs[?OutputKey=='restApiId${service_name}'].OutputValue" )
echo $restApiId
sed -e "s;%BUILD_VERSION%;${CI_COMMIT_SHA};g" "task-definition-base/task-definition-base-$(echo "$env" | tr '[:upper:]' '[:lower:]').json" > task-definition.json
export S3_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name $CLOUDFORMATION_STACK_NAME --output text --query "Stacks[0].Outputs[?OutputKey=='S3BUCKETNAME'].OutputValue" )
sed -i "s/%S3_BUCKET_NAME%/${S3_BUCKET_NAME}/g" task-definition.json
sed -i "s/%accountID%/${accountID}/g" task-definition.json
sed -i "s/%DB_HOST%/${DB_HOST}/g" task-definition.json
echo $MYSQL_PASSWORD_PARAMETER
sed -i "s;%MYSQL_PASSWORD_PARAMETER%;${MYSQL_PASSWORD_PARAMETER};g" task-definition.json
export DB_PASSWORD=$(aws ssm get-parameters --with-decryption --names MyStringParameter "${MYSQL_PASSWORD_PARAMETER}" --output text --query "Parameters[0].Value")
sed -i "s;%DB_PASSWORD%;${DB_PASSWORD};g" task-definition.json
sed -i "s/%AWS_DEFAULT_REGION%/${AWS_DEFAULT_REGION}/g" task-definition.json
sed -i "s/%service_name%/${service_name}/g" task-definition.json
service_lower_name=$(echo "$service_name" | tr '[:upper:]' '[:lower:]')
sed -i "s;%service_lower_name%;${service_lower_name};g" task-definition.json
