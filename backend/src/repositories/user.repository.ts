import type { HydratedDocument } from 'mongoose';

import { type IUser, type IUserMethods, User } from '../models/User';

export type UserDocument = HydratedDocument<IUser, IUserMethods>;

export function findByEmail(email: string): Promise<UserDocument | null> {
  return User.findOne({ email }).exec();
}

export function findByEmailWithPassword(email: string): Promise<UserDocument | null> {
  return User.findOne({ email }).select('+password').exec();
}

export function findById(id: string): Promise<UserDocument | null> {
  return User.findById(id).exec();
}

export function create(data: Pick<IUser, 'email' | 'password' | 'name'>): Promise<UserDocument> {
  return User.create(data);
}
