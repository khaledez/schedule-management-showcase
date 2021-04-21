#!/bin/sh -e

npm config set color false

echo "Starting Docker container in $NODE_ENV ..."
#npx sequelize db:create

echo "Running Database Migrations ... "
#npx sequelize db:migrate
npx sequelize db:migrate

"$@"
