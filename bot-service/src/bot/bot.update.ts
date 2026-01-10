import { Injectable, Logger } from '@nestjs/common';
import { Message as TelegramMessage } from '@telegraf/types';
import { Start, Help, Update, Ctx, On } from 'nestjs-telegraf';
import { ChannelService } from 'src/channel/channel.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { UserService } from 'src/user/user.service';
import { Context } from 'telegraf';

type MessageWithForwardFromChat = TelegramMessage & {
  forward_from_chat: {
    type: string;
    id: number;
    title: string;
    username?: string;
  };
};

@Update()
@Injectable()
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    private userService: UserService,
    private channelService: ChannelService,
    private subscriptionService: SubscriptionService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const telegramId = ctx.from.id.toString();

    const username = ctx.from.username;

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

  @On('message')
  async onMessage(@Ctx() ctx: Context) {
    const message = ctx.message as MessageWithForwardFromChat;

    if (!message) return;

    this.logger.debug(`Received message: ${JSON.stringify(message)}`);

    if ('forward_from_chat' in message && message.forward_from_chat) {
      if (message.forward_from_chat.type === 'channel') {
        await this.handleForwardedMessage(ctx, message);
      }
      return;
    }

    if ('text' in message && message.text) {
      const text = message.text;
      this.logger.debug(`Text message: ${text}`);

      // Проверяем наличие ссылки на канал
      const channelLinkMatch = text.match(/https?:\/\/t\.me\/([a-zA-Z0-9_]+)/);

      if (channelLinkMatch) {
        this.logger.log(`Channel link detected: ${text}`);
        await this.handleChannelLink(ctx, channelLinkMatch[1]);
        return;
      }
    }
  }

  private async handleForwardedMessage(
    ctx: Context,
    message: MessageWithForwardFromChat,
  ) {
    const telegramId = ctx.from.id.toString();
    const forwardedChannel = message.forward_from_chat;

    const channelTelegramId = forwardedChannel.id.toString();
    const channelTitle = forwardedChannel.title;
    const channelUsername = forwardedChannel.username || '';

    await this.handleChannelAdd(
      ctx,
      telegramId,
      channelTelegramId,
      channelTitle,
      channelUsername,
    );
  }

  private async handleChannelLink(ctx: Context, channelUsername: string) {
    const telegramId = ctx.from.id.toString();

    this.logger.log(`Processing channel: @${channelUsername}`);

    await ctx.reply('⏳ Проверяю канал...');

    try {
      const chat = await ctx.telegram.getChat(`@${channelUsername}`);

      this.logger.log(`Chat info: type=${chat.type}, id=${chat.id}`);

      if (chat.type !== 'channel') {
        await ctx.reply('❌ Это не канал. Отправь ссылку на канал.');
        return;
      }

      const channelTelegramId = chat.id.toString();
      const channelTitle = 'title' in chat ? chat.title : channelUsername;
      const username = 'username' in chat ? chat.username : undefined;

      this.logger.log(`Channel found: ${channelTitle} (${channelTelegramId})`);

      await this.handleChannelAdd(
        ctx,
        telegramId,
        channelTelegramId,
        channelTitle,
        username,
      );
    } catch (error) {
      this.logger.error('Failed to get channel info:', error);
      await ctx.reply(
        '❌ Не могу получить информацию о канале. Убедись что:\n' +
          '• Канал публичный\n' +
          '• Ссылка правильная\n\n' +
          'Или перешли мне пост из этого канала.',
      );
    }
  }

  private async handleChannelAdd(
    ctx: Context,
    userTelegramId: string,
    channelTelegramId: string,
    channelTitle: string,
    channelUsername?: string,
  ): Promise<void> {
    try {
      const user = await this.userService.findByTelegramId(userTelegramId);
      if (!user) {
        await ctx.reply('❌ Произошла ошибка. Попробуй /start');
        return;
      }

      let channel =
        await this.channelService.findByTelegramId(channelTelegramId);

      if (!channel) {
        channel = await this.channelService.findOrCreate({
          telegramId: channelTelegramId,
          username: channelUsername,
          title: channelTitle,
        });
      }

      const isSubscribed = await this.subscriptionService.isSubscribed(
        user.id,
        channel.id,
      );

      if (isSubscribed) {
        await ctx.reply(
          `ℹ️ Ты уже подписан на канал "${channelTitle}".\n\n` +
            'Используй /list чтобы посмотреть все свои каналы.',
        );
        return;
      }

      await this.subscriptionService.subscribe(user, channel);

      const subscriptionsCount =
        await this.subscriptionService.getUserSubscriptionsCount(user.id);

      await ctx.reply(
        `✅ Канал "${channelTitle}" добавлен в твою ленту!\n\n` +
          `📊 У тебя ${subscriptionsCount} из 50 каналов.\n\n` +
          'Теперь новые посты из этого канала будут приходить сюда.',
      );
    } catch (error) {
      this.logger.error('Error adding channel:', error);

      if (
        error instanceof Error &&
        (error.message.includes('лимит') || error.message.includes('Достигнут'))
      ) {
        await ctx.reply(error.message);
      } else {
        await ctx.reply(
          '❌ Произошла ошибка при добавлении канала. Попробуй еще раз.',
        );
      }
    }
  }
}
