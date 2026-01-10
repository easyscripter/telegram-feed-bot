import { Channel } from 'src/channel/entities/channel.entity';
import { User } from 'src/user/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('subscriptions')
@Unique(['user', 'channel'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Channel, (channel) => channel.subscriptions, {
    onDelete: 'CASCADE',
  })
  channel: Channel;

  @CreateDateColumn()
  addedAt: Date;
}
