import { Inject, Module } from '@nestjs/common';
import { SEQUELIZE } from 'common/constants';
import { Sequelize } from 'sequelize-typescript';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {
  constructor(@Inject(SEQUELIZE) private readonly sequelize: Sequelize) {}

  async onModuleDestroy() {
    await this.sequelize.close();
  }
}
