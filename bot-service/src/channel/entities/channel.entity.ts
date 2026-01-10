import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Subscription } from '../../subscription/entities/subscription.entity';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true })
  telegramId: string;

  @Column({ nullable: true })
  username: string;

  @Column()
  title: string;

  @Column({ type: 'bigint', nullable: true })
  lastMessageId: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.channel)
  subscriptions: Subscription[];
}
