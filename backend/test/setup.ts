import mongoose from 'mongoose';

import { connectDB, disconnectDB } from '../src/lib/db';
import { Note } from '../src/models/Note';
import { User } from '../src/models/User';

export const mochaHooks = {
  async beforeAll() {
    await connectDB();
    // unique/text indexes are built asynchronously; tests that rely on them
    // race the build unless we wait for it here
    await Promise.all([User.init(), Note.init()]);
  },

  async afterEach() {
    // deleteMany rather than dropDatabase so the indexes above survive
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((c) => c.deleteMany({})));
  },

  async afterAll() {
    await disconnectDB();
  },
};
