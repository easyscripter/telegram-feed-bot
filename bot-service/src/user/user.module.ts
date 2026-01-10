import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserCron } from './user.cron';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService, UserCron],
  exports: [UserService],
})
export class UserModule {}
