import type { HydratedDocument } from 'mongoose';

import { type IUser, type IUserMethods, User } from '../models/User';

export type UserDocument = HydratedDocument<IUser, IUserMethods>;

// exported as an object rather than loose functions so tests can replace
// individual methods; bare function exports are immutable once compiled
export const userRepository = {
  findByEmail(email: string): Promise<UserDocument | null> {
    return User.findOne({ email }).exec();
  },

  // the password field is select:false, so callers that need it must ask here
  findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return User.findOne({ email }).select('+password').exec();
  },

  findById(id: string): Promise<UserDocument | null> {
    return User.findById(id).exec();
  },

  create(data: Pick<IUser, 'email' | 'password' | 'name'>): Promise<UserDocument> {
    return User.create(data);
  },
};
