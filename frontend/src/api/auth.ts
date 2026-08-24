import { api } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface UserResponse {
  user: User;
}

export const authApi = {
  signup: (input: { name: string; email: string; password: string }) =>
    api.post<UserResponse>('/api/auth/signup', input).then((r) => r.user),

  login: (input: { email: string; password: string }) =>
    api.post<UserResponse>('/api/auth/login', input).then((r) => r.user),

  logout: () => api.post<{ message: string }>('/api/auth/logout'),

  me: () => api.get<UserResponse>('/api/auth/me').then((r) => r.user),
};
