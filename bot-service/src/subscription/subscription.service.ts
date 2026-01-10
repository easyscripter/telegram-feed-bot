import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Channel } from 'src/channel/entities/channel.entity';

const MAX_SUBSCRIPTIONS = 50;

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async isSubscribed(userId: string, channelId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        user: { id: userId },
        channel: { id: channelId },
      },
    });
    return !!subscription;
  }

  async getUserSubscriptionsCount(userId: string): Promise<number> {
    return this.subscriptionRepository.count({
      where: { user: { id: userId } },
    });
  }

  async subscribe(user: User, channel: Channel): Promise<Subscription> {
    const exists = await this.isSubscribed(user.id, channel.id);
    if (exists) {
      throw new BadRequestException('Вы уже подписаны на этот канал');
    }

    const count = await this.getUserSubscriptionsCount(user.id);
    if (count >= MAX_SUBSCRIPTIONS) {
      throw new BadRequestException(
        `Достигнут лимит подписок (${MAX_SUBSCRIPTIONS}). Удалите ненужные каналы через /settings`,
      );
    }

    const subscription = this.subscriptionRepository.create({
      user,
      channel,
    });
    await this.subscriptionRepository.save(subscription);

    this.logger.log(
      `✅ User ${user.telegramId} subscribed to channel ${channel.title}`,
    );

    return subscription;
  }

  async unsubscribe(userId: string, channelId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        user: { id: userId },
        channel: { id: channelId },
      },
    });

    if (!subscription) {
      return false;
    }

    await this.subscriptionRepository.remove(subscription);
    this.logger.log(`Unsubscribed user ${userId} from channel ${channelId}`);
    return true;
  }

  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { user: { id: userId } },
      relations: ['channel'],
    });
  }

  async getSubscribersByChannel(channelId: string): Promise<User[]> {
    const subscriptions = await this.subscriptionRepository.find({
      where: { channel: { id: channelId } },
      relations: ['user'],
    });

    return subscriptions.map((sub) => sub.user);
  }
}
