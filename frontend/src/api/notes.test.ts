import { api } from './client';
import { notesApi } from './notes';

jest.mock('./client', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mocked = api as jest.Mocked<typeof api>;

const note = { id: 'abc123', title: 'Groceries' };

describe('notesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('unwraps the list from the response envelope', async () => {
    mocked.get.mockResolvedValue({ notes: [note] });

    await expect(notesApi.list()).resolves.toEqual([note]);
    expect(mocked.get).toHaveBeenCalledWith('/api/notes');
  });

  it('unwraps a single note', async () => {
    mocked.get.mockResolvedValue({ note });

    await expect(notesApi.get('abc123')).resolves.toEqual(note);
    expect(mocked.get).toHaveBeenCalledWith('/api/notes/abc123');
  });

  it('posts the new note and returns what came back', async () => {
    mocked.post.mockResolvedValue({ note });

    await expect(notesApi.create({ title: 'Groceries' })).resolves.toEqual(note);
    expect(mocked.post).toHaveBeenCalledWith('/api/notes', { title: 'Groceries' });
  });

  it('patches only the fields it was given', async () => {
    mocked.patch.mockResolvedValue({ note });

    await notesApi.update('abc123', { title: 'Weekly shop' });

    expect(mocked.patch).toHaveBeenCalledWith('/api/notes/abc123', { title: 'Weekly shop' });
  });

  it('deletes by id', async () => {
    mocked.delete.mockResolvedValue(undefined);

    await notesApi.remove('abc123');

    expect(mocked.delete).toHaveBeenCalledWith('/api/notes/abc123');
  });

  it('escapes an id so it cannot change which path is requested', async () => {
    mocked.get.mockResolvedValue({ note });

    await notesApi.get('../auth/me');

    expect(mocked.get).toHaveBeenCalledWith('/api/notes/..%2Fauth%2Fme');
  });
});
