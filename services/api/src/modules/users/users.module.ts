import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AdminUsersController } from './users.admin.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

