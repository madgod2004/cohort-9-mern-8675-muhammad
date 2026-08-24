import { AppError } from '../errors/AppError';
import { signToken } from '../lib/jwt';
import {
  type UserDocument,
  type UserWithoutPassword,
  userRepository,
} from '../repositories/user.repository';
import type { LoginInput, SignupInput } from '../schemas/auth.schema';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

function toPublicUser(user: UserDocument | UserWithoutPassword): PublicUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

function toAuthResult(user: UserDocument): AuthResult {
  return {
    token: signToken({ userId: user._id.toString() }),
    user: toPublicUser(user),
  };
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await userRepository.findById(userId);

  // the token verified but the account is gone - treat as an invalid session
  if (!user) {
    throw new AppError(401, 'Invalid or expired session');
  }

  return toPublicUser(user);
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const existing = await userRepository.findByEmail(input.email.toLowerCase().trim());
  if (existing) {
    throw new AppError(409, 'Email already registered');
  }

  const user = await userRepository.create(input);
  return toAuthResult(user);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await userRepository.findByEmailWithPassword(input.email.toLowerCase().trim());

  // same message for both failures so the response cannot be used to discover which emails have accounts
  if (!user || !(await user.comparePassword(input.password))) {
    throw new AppError(401, 'Invalid email or password');
  }

  return toAuthResult(user);
}
