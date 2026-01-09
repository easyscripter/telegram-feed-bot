import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';

@Module({
  imports: [],
  providers: [BotUpdate],
})
export class BotModule {}
