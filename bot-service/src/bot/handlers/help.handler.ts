import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';

@Injectable()
export class HelpHandler {
  private readonly logger = new Logger(HelpHandler.name);

  async handle(ctx: Context): Promise<void> {
    this.logger.log(`User requested help`);

    await ctx.reply(
      '📖 Доступные команды:\n\n' +
        '/start - Начать работу\n' +
        '/list - Список ваших каналов\n' +
        '/help - Эта справка',
    );
  }
}
