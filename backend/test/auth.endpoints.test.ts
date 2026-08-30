import { expect } from 'chai';
import request from 'supertest';

import app from '../src/app';

const credentials = {
  email: 'bob@example.com',
  password: 'supersecret',
  name: 'Bob',
};

function cookieHeader(res: request.Response): string {
  const raw = res.headers['set-cookie'] as unknown as string[] | undefined;
  return raw?.join('; ') ?? '';
}

describe('POST /api/auth/signup', () => {
  it('creates the account and returns the public user', async () => {
    const res = await request(app).post('/api/auth/signup').send(credentials);

    expect(res.status).to.equal(201);
    expect(res.body.user.email).to.equal('bob@example.com');
    expect(res.body.user.name).to.equal('Bob');
    expect(res.body.user.id).to.be.a('string');
  });

  it('sets an httpOnly, sameSite cookie', async () => {
    const res = await request(app).post('/api/auth/signup').send(credentials);
    const cookie = cookieHeader(res);

    expect(cookie).to.include('token=');
    expect(cookie).to.include('HttpOnly');
    expect(cookie).to.include('SameSite=Strict');
  });

  it('does not put the token in the response body', async () => {
    const res = await request(app).post('/api/auth/signup').send(credentials);

    expect(res.body.token).to.be.undefined;
    expect(JSON.stringify(res.body)).to.not.include('eyJ');
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/signup').send(credentials);

    const res = await request(app).post('/api/auth/signup').send(credentials);

    expect(res.status).to.equal(409);
  });

  it('rejects an invalid body with 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'notanemail', password: 'abc', name: '' });

    expect(res.status).to.equal(400);
    expect(res.body.error.message).to.include('email');
  });

  it('rejects a password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...credentials, password: 'short' });

    expect(res.status).to.equal(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(credentials);
  });

  it('returns the user and sets a cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).to.equal(200);
    expect(res.body.user.email).to.equal('bob@example.com');
    expect(cookieHeader(res)).to.include('token=');
  });

  it('accepts an email with padding and mixed case', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '  BOB@EXAMPLE.COM  ', password: credentials.password });

    expect(res.status).to.equal(200);
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' });

    expect(res.status).to.equal(401);
  });

  it('responds identically for an unknown email and a wrong password', async () => {
    const unknownUser = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: credentials.password });

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' });

    expect(unknownUser.status).to.equal(wrongPassword.status);
    expect(unknownUser.body.error.message).to.equal(wrongPassword.body.error.message);
  });
});

describe('GET /api/auth/me', () => {
  it('rejects a request with no cookie', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).to.equal(401);
  });

  it('rejects a tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'token=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJmYWtlIn0.not-a-real-signature');

    expect(res.status).to.equal(401);
  });

  it('returns the signed-in user', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/signup').send(credentials);

    const res = await agent.get('/api/auth/me');

    expect(res.status).to.equal(200);
    expect(res.body.user.email).to.equal('bob@example.com');
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).to.equal(200);
    expect(cookieHeader(res)).to.include('token=;');
  });

  it('ends the session so /me is rejected afterwards', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/signup').send(credentials);
    expect((await agent.get('/api/auth/me')).status).to.equal(200);

    await agent.post('/api/auth/logout');

    expect((await agent.get('/api/auth/me')).status).to.equal(401);
  });
});
