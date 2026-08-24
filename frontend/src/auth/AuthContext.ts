import { createContext } from 'react';

import type { User } from '../api/auth';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  signup: (input: { name: string; email: string; password: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);
