import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { UserModule } from 'src/user/user.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { ChannelModule } from 'src/channel/channel.module';
import { StartHandler } from './handlers/start.handler';
import { HelpHandler } from './handlers/help.handler';
import { ChannelAddHandler } from './handlers/channel-add.handler';
import { ChannelListHandler } from './handlers/channel-list.handler';

@Module({
  imports: [UserModule, SubscriptionModule, ChannelModule],
  providers: [
    BotUpdate,
    StartHandler,
    HelpHandler,
    ChannelAddHandler,
    ChannelListHandler,
  ],
})
export class BotModule {}
