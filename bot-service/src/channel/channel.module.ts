import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channel])],
  providers: [ChannelService],
  exports: [ChannelService],
})
export class ChannelModule {}
