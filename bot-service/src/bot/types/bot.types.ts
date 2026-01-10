import { Message } from 'telegraf/typings/core/types/typegram';

export type MessageWithForwardFromChat = Message & {
  forward_from_chat: {
    type: string;
    id: number;
    title: string;
    username?: string;
  };
};
