import type { User } from '../src/api/auth';
import type { Note } from '../src/api/notes';

export function fakeUser(overrides: Partial<User> = {}): User {
  return {
    id: '1',
    email: 'alice@example.com',
    name: 'Alice',
    createdAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  };
}

export function fakeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    title: 'Groceries',
    content: '<p>Coffee and oats.</p>',
    contentText: 'Coffee and oats.',
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-01T09:00:00.000Z',
    ...overrides,
  };
}
