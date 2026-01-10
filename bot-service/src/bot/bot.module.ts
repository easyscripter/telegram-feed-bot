import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { UserModule } from 'src/user/user.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { ChannelModule } from 'src/channel/channel.module';

@Module({
  imports: [UserModule, SubscriptionModule, ChannelModule],
  providers: [BotUpdate],
})
export class BotModule {}
