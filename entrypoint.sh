#!/bin/sh
aws ssm get-parameter --name "/${NODE_ENV}/config" --with-decryption --output text --query Parameter.Value 2>&1 | tee .env
cat .env
printf "Starting Docker container in $NODE_ENV...\n"
npm run db:create
printf "\n* Running Database Migrations *\n"
npm run db:migrate
$@
