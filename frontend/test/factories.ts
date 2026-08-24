import type { User } from '../src/api/auth';

export function fakeUser(overrides: Partial<User> = {}): User {
  return {
    id: '1',
    email: 'alice@example.com',
    name: 'Alice',
    createdAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  };
}
