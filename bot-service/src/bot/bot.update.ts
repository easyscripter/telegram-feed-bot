import { Injectable } from '@nestjs/common';
import { Start, Help, Update, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
@Injectable()
export class BotUpdate {
  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.reply(
      '👋 Привет! Я, бот FeedFusion, помогу тебе создать персональную ленту из Telegram каналов.\n\n' +
        '📌 Отправь мне ссылку на канал или перешли пост из канала.\n\n' +
        'Используй /help для справки.',
    );
  }

  @Help()
  async onHelp(@Ctx() ctx: Context) {
    await ctx.reply(
      '📖 Доступные команды:\n\n' +
        '/start - Начать работу\n' +
        '/list - Список ваших каналов\n' +
        '/settings - Настройки\n' +
        '/help - Эта справка',
    );
  }
}
