import { Injectable, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class UserCron {
  private readonly logger = new Logger(UserCron.name);

  constructor(private userService: UserService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanUsersWithoutSubscriptions() {
    this.logger.log('Cleaning users without subscriptions');
    try {
      const deletedUsers =
        await this.userService.cleanUsersWithoutSubscriptions();
      this.logger.log(`Deleted ${deletedUsers} users without subscriptions`);
    } catch (error) {
      this.logger.error('Failed to clean users without subscriptions', error);
    }
  }
}
