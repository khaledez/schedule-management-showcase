#!/bin/sh
printf "Starting Docker container in $NODE_ENV...\n"
npm run db:create
printf "\n* Running Database Migrations *\n"
npm run db:migrate
$@
