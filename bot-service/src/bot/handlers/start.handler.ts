import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { Context } from 'telegraf';

@Injectable()
export class StartHandler {
  private readonly logger = new Logger(StartHandler.name);

  constructor(private readonly userService: UserService) {}

  async handle(ctx: Context): Promise<void> {
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username;

    this.logger.log(`User started bot: ${telegramId} (@${username})`);

    await this.userService.findOrCreate(telegramId, username);

    await ctx.reply(
      '👋 Привет! Я, бот FeedFusion, помогу тебе создать персональную ленту из Telegram каналов.\n\n' +
        '📌 Чтобы добавить канал:\n' +
        '• Перешли мне любой пост из канала\n' +
        '• Или отправь ссылку на канал (например: https://t.me/channelname)\n\n' +
        '📊 У тебя может быть максимум 50 каналов.\n\n' +
        'Используй /help для справки.',
    );
  }
}
