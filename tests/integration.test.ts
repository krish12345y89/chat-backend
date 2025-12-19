import request from "supertest";
import app from "../src/app";
import * as userService from "../src/modules/user/user.service";
import * as chatService from "../src/modules/chat/chat.service";
import { signToken } from "../src/utils/jwt.util";
import { redisClient } from "../src/config/redis.config";
import * as serverMod from "../src/server";

describe("Integration: auth + chat REST flows", () => {
  const aliceId = "64a1a1a1a1a1a1a1a1a1a1a1";
  const bobId = "64b2b2b2b2b2b2b2b2b2b2b2";

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("register -> login -> me", async () => {
    // mock findByUsername to simulate no existing user, then createUser
    jest
      .spyOn(userService, "findByUsername")
      .mockResolvedValueOnce(null as any);
    jest.spyOn(userService, "createUser").mockResolvedValueOnce({
      _id: aliceId,
      username: "alice",
      displayName: "Alice",
    } as any);

    const reg = await request(app)
      .post("/auth/register")
      .send({ username: "alice", password: "pass" })
      .expect(201);
    expect(reg.body).toHaveProperty("token");

    // mock login: findByUsername returns user and validatePassword true
    jest.spyOn(userService, "findByUsername").mockResolvedValueOnce({
      _id: aliceId,
      username: "alice",
      displayName: "Alice",
      passwordHash: "x",
    } as any);
    jest
      .spyOn(userService, "validatePassword")
      .mockResolvedValueOnce(true as any);

    const agent = request.agent(app);
    const login = await agent
      .post("/auth/login")
      .send({ username: "alice", password: "pass" })
      .expect(200);
    expect(login.body).toHaveProperty("token");

    // mock findById for /me
    jest.spyOn(userService, "findById").mockResolvedValueOnce({
      _id: aliceId,
      username: "alice",
      displayName: "Alice",
    } as any);

    // use agent's cookie session to call /auth/me without Authorization header
    const me = await agent.get("/auth/me").expect(200);
    expect(me.body.username).toBe("alice");
  });

  it("send message -> receive via socket -> fetch history -> conversations", async () => {
    const token = signToken({ userId: aliceId });

    // mock saveMessage
    const savedMessage = {
      _id: "m1",
      senderId: aliceId,
      receiverId: bobId,
      message: "hello",
    } as any;
    jest.spyOn(chatService, "saveMessage").mockResolvedValueOnce(savedMessage);

    // mock redisClient.get to indicate bob is online
    jest.spyOn(redisClient, "get" as any).mockResolvedValueOnce("socket:bob");

    // mock ioInstance to capture emits
    const emitMock = jest.fn();
    const toMock = jest.fn().mockReturnValue({ emit: emitMock });
    (serverMod as any).ioInstance = { to: toMock } as any;

    const res = await request(app)
      .post(`/chats/${aliceId}/send`)
      .set("Authorization", `Bearer ${token}`)
      .send({ receiverId: bobId, message: "hello" })
      .expect(201);

    expect(res.body.message).toBe("hello");
    expect(toMock).toHaveBeenCalledWith("socket:bob");
    expect(emitMock).toHaveBeenCalledWith("receive_message", savedMessage);

    // mock getChatHistory
    jest
      .spyOn(chatService, "getChatHistory")
      .mockResolvedValueOnce([savedMessage] as any);
    const history = await request(app)
      .get(`/chats/${aliceId}/with/${bobId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(history.body[0].message).toBe("hello");

    // mock getConversations
    jest.spyOn(chatService, "getConversations").mockResolvedValueOnce([
      {
        partner: bobId,
        lastMessage: "hello",
        lastAt: new Date().toISOString(),
      },
    ] as any);
    const conv = await request(app)
      .get(`/chats/${aliceId}/conversations`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(conv.body[0].partner).toBe(bobId);
  });
});
