<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Setup .env file
```bash
DB_NAME=YOUR_DATABASE_NAME
DB_USERNAME=OUR_DATABASE_USERNAME
DB_PASSWORD=OUR_DATABASE_PASSWORD
DB_HOST=OUR_DATABASE_HOST
DB_PORT=OUR_DATABASE_PORT
```

## Description
Generate a new service using:

```bash
$ nest g resource modules/{service_name}
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
$ sequelize migration:create --name your_migration_name

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

