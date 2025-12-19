import request from 'supertest';
import app from '../src/app';
import * as userService from '../src/modules/user/user.service';
import { verifyToken, signToken } from '../src/utils/jwt.util';

describe('Auth routes (register/login/me)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('POST /auth/register creates user and returns token', async () => {
    jest.spyOn(userService, 'findByUsername').mockResolvedValueOnce(null as any);
    jest.spyOn(userService, 'createUser').mockResolvedValueOnce({ _id: 'u1', username: 'alice', displayName: 'Alice' } as any);

    const res = await request(app)
      .post('/auth/register')
      .send({ username: 'alice', password: 'pass', displayName: 'Alice' })
      .expect(201);

    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('alice');
    const payload = verifyToken<{ userId: string }>(res.body.token);
    expect(payload.userId).toBeDefined();
  });

  it('POST /auth/login returns token for valid credentials', async () => {
    jest.spyOn(userService, 'findByUsername').mockResolvedValueOnce({ _id: 'u1', username: 'alice', passwordHash: 'x' } as any);
    jest.spyOn(userService, 'validatePassword').mockResolvedValueOnce(true as any);

    const agent = request.agent(app);
    const res = await agent
      .post('/auth/login')
      .send({ username: 'alice', password: 'pass' })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('alice');

    // cookie should be set on session-based login
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();

    // use agent (cookies persisted) to call /auth/me without Authorization header
    jest.spyOn(userService, 'findById').mockResolvedValueOnce({ _id: 'u1', username: 'alice', displayName: 'Alice' } as any);
    const me = await agent.get('/auth/me').expect(200);
    expect(me.body.username).toBe('alice');
  });

  it('GET /auth/me returns profile when authenticated', async () => {
    const user = { _id: 'u1', username: 'alice', displayName: 'Alice' } as any;
    const token = signToken({ userId: user._id });

    jest.spyOn(userService, 'findById').mockResolvedValueOnce(user as any);

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.username).toBe('alice');
  });
});
