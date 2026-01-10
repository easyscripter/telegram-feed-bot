import { Injectable } from '@nestjs/common';
import { Start, Help, Update, Ctx, On, Command, Action } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { StartHandler } from './handlers/start.handler';
import { HelpHandler } from './handlers/help.handler';
import { ChannelAddHandler } from './handlers/channel-add.handler';
import { ChannelListHandler } from './handlers/channel-list.handler';

@Update()
@Injectable()
export class BotUpdate {
  constructor(
    private startHandler: StartHandler,
    private helpHandler: HelpHandler,
    private channelAddHandler: ChannelAddHandler,
    private channelListHandler: ChannelListHandler,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.startHandler.handle(ctx);
  }

  @Help()
  async onHelp(@Ctx() ctx: Context) {
    await this.helpHandler.handle(ctx);
  }

  @Command('list')
  async onList(@Ctx() ctx: Context) {
    await this.channelListHandler.handleList(ctx);
  }

  @On('message')
  async onMessage(@Ctx() ctx: Context) {
    await this.channelAddHandler.handleMessage(ctx);
  }

  @Action(/channel_select:(.+)$/)
  async onChannelSelect(@Ctx() ctx: Context) {
    await this.channelListHandler.handleChannelSelect(ctx);
  }

  @Action(/^channel_delete:(.+)$/)
  async onChannelDelete(@Ctx() ctx: Context) {
    await this.channelListHandler.handleChannelDelete(ctx);
  }

  @Action('back_to_list')
  async onBackToList(@Ctx() ctx: Context) {
    await this.channelListHandler.handleBackToList(ctx);
  }
}
