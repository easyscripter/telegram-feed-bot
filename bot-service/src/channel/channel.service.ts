import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { Repository } from 'typeorm';

export interface CreateChannelDto {
  telegramId: string;
  username?: string;
  title: string;
}

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);

  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

  async findByTelegramId(telegramId: string): Promise<Channel | null> {
    return this.channelRepository.findOne({
      where: { telegramId },
      relations: ['subscriptions'],
    });
  }

  async findByUsername(username: string): Promise<Channel | null> {
    return this.channelRepository.findOne({
      where: { username },
      relations: ['subscriptions'],
    });
  }

  async create(data: CreateChannelDto): Promise<Channel> {
    const channel = this.channelRepository.create(data);
    await this.channelRepository.save(channel);
    this.logger.log(`Channel created: ${channel.id}`);
    return channel;
  }

  async findOrCreate(data: CreateChannelDto): Promise<Channel> {
    let channel = await this.findByTelegramId(data.telegramId);

    if (!channel) {
      channel = await this.create(data);
    }

    return channel;
  }

  async getSubscribersCount(channelId: string): Promise<number> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['subscriptions'],
    });
    return channel?.subscriptions?.length || 0;
  }
}
