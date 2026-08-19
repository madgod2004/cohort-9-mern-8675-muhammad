import { expect } from 'chai';
import sinon from 'sinon';

import { AppError } from '../src/errors/AppError';
import { verifyToken } from '../src/lib/jwt';
import { type UserDocument, userRepository } from '../src/repositories/user.repository';
import * as authService from '../src/services/auth.service';

function fakeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: { toString: () => 'user-id-1' },
    email: 'bob@example.com',
    name: 'Bob',
    password: 'hashed',
    comparePassword: sinon.stub().resolves(true),
    ...overrides,
  } as unknown as UserDocument;
}

async function captureError(fn: () => Promise<unknown>): Promise<AppError> {
  try {
    await fn();
  } catch (err) {
    return err as AppError;
  }
  throw new Error('expected the call to reject, but it resolved');
}

describe('auth service', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('signup', () => {
    it('returns a token and the public user when the email is free', async () => {
      sinon.stub(userRepository, 'findByEmail').resolves(null);
      sinon.stub(userRepository, 'create').resolves(fakeUser());

      const result = await authService.signup({
        email: 'bob@example.com',
        password: 'supersecret',
        name: 'Bob',
      });

      expect(verifyToken(result.token).userId).to.equal('user-id-1');
      expect(result.user).to.deep.equal({
        id: 'user-id-1',
        email: 'bob@example.com',
        name: 'Bob',
      });
    });

    it('passes the raw password to the repository so the model hashes it once', async () => {
      sinon.stub(userRepository, 'findByEmail').resolves(null);
      const create = sinon.stub(userRepository, 'create').resolves(fakeUser());

      await authService.signup({
        email: 'bob@example.com',
        password: 'supersecret',
        name: 'Bob',
      });

      expect(create.calledOnce).to.equal(true);
      expect(create.firstCall.args[0].password).to.equal('supersecret');
    });

    it('rejects with 409 when the email is already registered', async () => {
      sinon.stub(userRepository, 'findByEmail').resolves(fakeUser());
      const create = sinon.stub(userRepository, 'create');

      const err = await captureError(() =>
        authService.signup({ email: 'bob@example.com', password: 'supersecret', name: 'Bob' }),
      );

      expect(err).to.be.instanceOf(AppError);
      expect(err.statusCode).to.equal(409);
      expect(create.called).to.equal(false);
    });

    it('never exposes the password in the result', async () => {
      sinon.stub(userRepository, 'findByEmail').resolves(null);
      sinon.stub(userRepository, 'create').resolves(fakeUser());

      const result = await authService.signup({
        email: 'bob@example.com',
        password: 'supersecret',
        name: 'Bob',
      });

      expect(JSON.stringify(result)).to.not.include('supersecret');
      expect(JSON.stringify(result)).to.not.include('hashed');
    });
  });

  describe('login', () => {
    it('returns a token and the public user for correct credentials', async () => {
      sinon.stub(userRepository, 'findByEmailWithPassword').resolves(fakeUser());

      const result = await authService.login({
        email: 'bob@example.com',
        password: 'supersecret',
      });

      expect(verifyToken(result.token).userId).to.equal('user-id-1');
      expect(result.user.email).to.equal('bob@example.com');
    });

    it('rejects with 401 when no user matches the email', async () => {
      sinon.stub(userRepository, 'findByEmailWithPassword').resolves(null);

      const err = await captureError(() =>
        authService.login({ email: 'nobody@example.com', password: 'supersecret' }),
      );

      expect(err.statusCode).to.equal(401);
    });

    it('rejects with 401 when the password does not match', async () => {
      sinon
        .stub(userRepository, 'findByEmailWithPassword')
        .resolves(fakeUser({ comparePassword: sinon.stub().resolves(false) }));

      const err = await captureError(() =>
        authService.login({ email: 'bob@example.com', password: 'wrong' }),
      );

      expect(err.statusCode).to.equal(401);
    });

    it('gives an identical response for unknown email and wrong password', async () => {
      const findStub = sinon.stub(userRepository, 'findByEmailWithPassword');

      findStub.resolves(null);
      const unknownUser = await captureError(() =>
        authService.login({ email: 'nobody@example.com', password: 'supersecret' }),
      );

      findStub.resolves(fakeUser({ comparePassword: sinon.stub().resolves(false) }));
      const wrongPassword = await captureError(() =>
        authService.login({ email: 'bob@example.com', password: 'wrong' }),
      );

      expect(unknownUser.statusCode).to.equal(wrongPassword.statusCode);
      expect(unknownUser.message).to.equal(wrongPassword.message);
    });

    it('normalises the email before looking it up', async () => {
      const find = sinon.stub(userRepository, 'findByEmailWithPassword').resolves(fakeUser());

      await authService.login({ email: '  BOB@EXAMPLE.COM  ', password: 'supersecret' });

      expect(find.firstCall.args[0]).to.equal('bob@example.com');
    });
  });

  describe('getCurrentUser', () => {
    it('returns the public user', async () => {
      sinon.stub(userRepository, 'findById').resolves(fakeUser());

      const user = await authService.getCurrentUser('user-id-1');

      expect(user).to.deep.equal({ id: 'user-id-1', email: 'bob@example.com', name: 'Bob' });
    });

    it('rejects with 401 when the account no longer exists', async () => {
      sinon.stub(userRepository, 'findById').resolves(null);

      const err = await captureError(() => authService.getCurrentUser('user-id-1'));

      expect(err.statusCode).to.equal(401);
    });
  });
});
