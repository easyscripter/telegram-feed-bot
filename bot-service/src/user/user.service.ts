import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOrCreate(telegramId: string, username: string): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { telegramId },
      relations: ['subscriptions'],
    });

    if (!user) {
      user = this.userRepository.create({
        telegramId,
        username,
      });
      await this.userRepository.save(user);
      this.logger.log(`User ${user.id} created`);
    }

    return user;
  }

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { telegramId },
      relations: ['subscriptions'],
    });
  }

  async cleanUsersWithoutSubscriptions(): Promise<number> {
    const users = await this.userRepository.find({
      where: { subscriptions: [] },
      select: ['id'],
    });
    const deletedCount = await this.userRepository.delete(
      users.map((user) => user.id),
    );
    this.logger.log(
      `Deleted ${deletedCount.affected} users without subscriptions`,
    );
    return deletedCount.affected;
  }
}
