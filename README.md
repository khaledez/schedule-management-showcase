# Schedule Management Service

### Development environment requirements

- Docker Desktop
- nodejs LTS (14)
- nestjs-cli `npm i -g @nestjs/cli`

### Initialize DB

```sh
$ docker-compose up -d
```

### Setup .env file

```sh
NODE_ENV=development
DB_NAME=schedule-management
DB_USERNAME=root
DB_PASSWORD=very_secr3t
DB_HOST=localhost
DB_PORT=3306
```

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Migration commands

```bash
# create database
$ npm run db:create

# create a new migration
$ npm run db:migration:create -- your_migration_name

# run migrations
$ npm run db:migrate

# run seeders
$ npm run db:seed-dev

# reset database
$ npm run db:reset

# drop database
$ npm run db:drop

```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
