import request from 'supertest';
import app from '../src/app';
import * as chatService from '../src/modules/chat/chat.service';
import { signToken } from '../src/utils/jwt.util';
import { redisClient } from '../src/config/redis.config';
import * as serverMod from '../src/server';

describe('Chat routes (REST)', () => {
  afterEach(() => jest.restoreAllMocks());

  const aliceId = 'a1';
  const bobId = 'b1';
  const aliceToken = signToken({ userId: aliceId });

  it('GET /chats/:userId/with/:withUser returns history', async () => {
    jest.spyOn(chatService, 'getChatHistory').mockResolvedValueOnce([
      { senderId: aliceId, receiverId: bobId, message: 'hi' },
    ] as any);

    const res = await request(app)
      .get(`/chats/${aliceId}/with/${bobId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body[0].message).toBe('hi');
  });

  it('POST /chats/:userId/send saves message and emits if online', async () => {
    const saved = { _id: 'm1', senderId: aliceId, receiverId: bobId, message: 'hello' } as any;
    jest.spyOn(chatService, 'saveMessage').mockResolvedValueOnce(saved as any);
    jest.spyOn(redisClient, 'get' as any).mockResolvedValueOnce('socket:bob');

    const emitMock = jest.fn();
    const toMock = jest.fn().mockReturnValue({ emit: emitMock });
    (serverMod as any).ioInstance = { to: toMock } as any;

    const res = await request(app)
      .post(`/chats/${aliceId}/send`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ receiverId: bobId, message: 'hello' })
      .expect(201);

    expect(res.body.message).toBe('hello');
    expect(toMock).toHaveBeenCalledWith('socket:bob');
    expect(emitMock).toHaveBeenCalledWith('receive_message', saved);
  });

  it('GET /chats/:userId/conversations returns list', async () => {
    jest.spyOn(chatService, 'getConversations').mockResolvedValueOnce([{ partner: bobId, lastMessage: 'hello', lastAt: new Date().toISOString() }] as any);

    const res = await request(app)
      .get(`/chats/${aliceId}/conversations`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body[0].partner).toBe(bobId);
  });
});
