import { expect } from 'chai';
import { Types } from 'mongoose';

import { userRepository } from '../src/repositories/user.repository';

const validUser = { email: 'bob@example.com', password: 'supersecret', name: 'Bob' };

describe('user repository', () => {
  describe('create', () => {
    it('persists a user and returns the document', async () => {
      const user = await userRepository.create(validUser);

      expect(user._id).to.exist;
      expect(user.email).to.equal('bob@example.com');
      expect(user.name).to.equal('Bob');
    });
  });

  describe('findByEmail', () => {
    it('finds an existing user', async () => {
      await userRepository.create(validUser);

      const found = await userRepository.findByEmail('bob@example.com');

      expect(found?.email).to.equal('bob@example.com');
    });

    it('returns null when no user matches', async () => {
      const found = await userRepository.findByEmail('nobody@example.com');

      expect(found).to.equal(null);
    });

    it('does not return the password', async () => {
      await userRepository.create(validUser);

      const found = await userRepository.findByEmail('bob@example.com');

      expect(found?.password).to.equal(undefined);
    });
  });

  describe('findByEmailWithPassword', () => {
    it('returns the password hash', async () => {
      await userRepository.create(validUser);

      const found = await userRepository.findByEmailWithPassword('bob@example.com');

      expect(found?.password).to.be.a('string');
      expect(found?.password).to.not.equal('supersecret');
    });

    it('returns null when no user matches', async () => {
      const found = await userRepository.findByEmailWithPassword('nobody@example.com');

      expect(found).to.equal(null);
    });
  });

  describe('findById', () => {
    it('finds a user by id', async () => {
      const created = await userRepository.create(validUser);

      const found = await userRepository.findById(created._id.toString());

      expect(found?.email).to.equal('bob@example.com');
    });

    it('returns null for an id that does not exist', async () => {
      const found = await userRepository.findById(new Types.ObjectId().toString());

      expect(found).to.equal(null);
    });
  });
});
