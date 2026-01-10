import { Injectable, Logger } from '@nestjs/common';
import { ChannelService } from 'src/channel/channel.service';
import { Subscription } from 'src/subscription/entities/subscription.entity';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { UserService } from 'src/user/user.service';
import { Context } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class ChannelListHandler {
  private readonly logger = new Logger(ChannelListHandler.name);

  constructor(
    private userService: UserService,
    private channelService: ChannelService,
    private subscriptionService: SubscriptionService,
  ) {}

  async handleList(ctx: Context) {
    const telegramId = ctx.from.id.toString();

    try {
      const user = await this.userService.findByTelegramId(telegramId);
      if (!user) {
        await ctx.reply('❌ Пользователь не найден. Попробуй /start');
        return;
      }

      const subscriptions = await this.subscriptionService.getUserSubscriptions(
        user.id,
      );

      if (!subscriptions.length) {
        await ctx.reply(
          '📭 У тебя пока нет каналов в ленте.\n\n' +
            'Перешли мне пост из канала или отправь ссылку на канал чтобы добавить его.',
        );
        return;
      }

      const keyboard: InlineKeyboardMarkup =
        this.buildChannelListKeyboard(subscriptions);

      await ctx.reply(
        `📋 Твои каналы (${subscriptions.length}/50):\n\n` +
          'Выбери канал для управления:',
        { reply_markup: keyboard },
      );
    } catch (error) {
      this.logger.error('Error showing channel list:', error);
      await ctx.reply('❌ Произошла ошибка при загрузке списка каналов.');
    }
  }

  private buildChannelListKeyboard(
    subscriptions: Subscription[],
  ): InlineKeyboardMarkup {
    return {
      inline_keyboard: subscriptions.map((sub) => [
        {
          text: `📢 ${sub.channel.title}`,
          callback_data: `channel_select:${sub.channel.id}`,
        },
      ]),
    };
  }

  async handleChannelSelect(ctx: Context): Promise<void> {
    const callbackQuery = ctx.callbackQuery as { data: string };
    const channelId = callbackQuery.data.split(':')[1];

    this.logger.log(`User selected channel ${channelId}`);

    try {
      const channel = await this.channelService.findById(channelId);

      if (!channel) {
        await ctx.answerCbQuery('❌ Канал не найден');
        return;
      }

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🗑️ Удалить канал',
              callback_data: `channel_delete:${channelId}`,
            },
          ],
          ...(channel.username
            ? [
                [
                  {
                    text: '🔗 Перейти в канал',
                    url: `https://t.me/${channel.username}`,
                  },
                ],
              ]
            : []),
          [
            {
              text: '◀️ Назад к списку',
              callback_data: 'back_to_list',
            },
          ],
        ],
      };

      await ctx.editMessageText(
        `📢 ${channel.title}\n\n` +
          `📅 Добавлен: ${channel.createdAt.toLocaleDateString('ru-RU')}\n\n` +
          'Выбери действие:',
        { reply_markup: keyboard },
      );
      await ctx.answerCbQuery();
    } catch (error) {
      this.logger.error('Error handling channel selection:', error);
      await ctx.answerCbQuery(
        '❌ Произошла ошибка при обработке выбора канала.',
      );
    }
  }

  async handleChannelDelete(ctx: Context): Promise<void> {
    const callbackQuery = ctx.callbackQuery as { data: string };
    const channelId = callbackQuery.data.split(':')[1];
    const telegramId = ctx.from.id.toString();

    this.logger.log(`User ${telegramId} deleting channel: ${channelId}`);

    try {
      const user = await this.userService.findByTelegramId(telegramId);
      if (!user) {
        await ctx.answerCbQuery('❌ Пользователь не найден');
        return;
      }

      const channel = await this.channelService.findById(channelId);
      if (!channel) {
        await ctx.answerCbQuery('❌ Канал не найден');
        return;
      }

      const deleted = await this.subscriptionService.unsubscribe(
        user.id,
        channelId,
      );

      if (deleted) {
        this.logger.log(`Channel ${channelId} deleted for user ${telegramId}`);
        await ctx.answerCbQuery(`✅ Канал "${channel.title}" удален из ленты`);
        await this.showUpdatedChannelList(ctx, user.id);
      } else {
        await ctx.answerCbQuery('❌ Не удалось удалить канал');
      }
    } catch (error) {
      this.logger.error('Error deleting channel:', error);
      await ctx.answerCbQuery('❌ Произошла ошибка при удалении канала');
    }
  }

  async handleBackToList(ctx: Context): Promise<void> {
    const telegramId = ctx.from.id.toString();

    this.logger.log(`User ${telegramId} returning to channel list`);

    try {
      const user = await this.userService.findByTelegramId(telegramId);
      if (!user) {
        await ctx.answerCbQuery('❌ Пользователь не найден');
        return;
      }

      await this.showUpdatedChannelList(ctx, user.id);
      await ctx.answerCbQuery();
    } catch (error) {
      this.logger.error('Error returning to list:', error);
      await ctx.answerCbQuery('❌ Произошла ошибка');
    }
  }

  private async showUpdatedChannelList(
    ctx: Context,
    userId: string,
  ): Promise<void> {
    const subscriptions =
      await this.subscriptionService.getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      await ctx.editMessageText(
        '📭 У тебя больше нет каналов в ленте.\n\n' +
          'Перешли мне пост из канала или отправь ссылку на канал чтобы добавить его.',
      );
    } else {
      const keyboard = this.buildChannelListKeyboard(subscriptions);

      await ctx.editMessageText(
        `📋 Твои каналы (${subscriptions.length}/50):\n\n` +
          'Выбери канал для управления:',
        { reply_markup: keyboard },
      );
    }
  }
}
