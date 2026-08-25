import { act, renderHook, waitFor } from '@testing-library/react';

import { fakeNote } from '../../test/factories';
import { ApiError } from '../api/client';
import { notesApi } from '../api/notes';
import { useNotes } from './useNotes';

jest.mock('../api/notes', () => ({
  notesApi: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

const mocked = notesApi as jest.Mocked<typeof notesApi>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const older = fakeNote({ id: 'a', title: 'Older', updatedAt: '2026-08-01T09:00:00.000Z' });
const newer = fakeNote({ id: 'b', title: 'Newer', updatedAt: '2026-08-20T09:00:00.000Z' });

async function renderLoaded(notes = [newer, older]) {
  mocked.list.mockResolvedValue(notes);
  const view = renderHook(() => useNotes());
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

describe('useNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading', () => {
    it('starts out loading and then exposes the notes', async () => {
      mocked.list.mockResolvedValue([newer]);

      const { result } = renderHook(() => useNotes());
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.notes).toEqual([newer]);
      expect(result.current.error).toBeNull();
    });

    it('puts the newest first even if the server sends them out of order', async () => {
      mocked.list.mockResolvedValue([older, newer]);

      const { result } = renderHook(() => useNotes());

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.notes).toEqual([newer, older]);
    });

    it('reports the server message when the list cannot be fetched', async () => {
      mocked.list.mockRejectedValue(new ApiError(500, 'Something went wrong.'));

      const { result } = renderHook(() => useNotes());

      await waitFor(() => expect(result.current.error).toBe('Something went wrong.'));
      expect(result.current.notes).toEqual([]);
    });

    it('clears a previous error when reload succeeds', async () => {
      mocked.list.mockRejectedValueOnce(new ApiError(0, 'Cannot reach the server.'));
      const { result } = renderHook(() => useNotes());
      await waitFor(() => expect(result.current.error).not.toBeNull());

      mocked.list.mockResolvedValue([newer]);
      await act(() => result.current.reload());

      expect(result.current.error).toBeNull();
      expect(result.current.notes).toEqual([newer]);
    });

    it('ignores a slow earlier request that answers after a newer one', async () => {
      const first = deferred<(typeof newer)[]>();
      const second = deferred<(typeof newer)[]>();
      mocked.list.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

      const { result } = renderHook(() => useNotes());
      let secondReload!: Promise<void>;
      act(() => {
        secondReload = result.current.reload();
      });

      // the second request wins even though the first one lands last
      await act(async () => {
        second.resolve([newer]);
        await secondReload;
      });
      await act(async () => {
        first.resolve([older]);
        await first.promise;
      });

      expect(result.current.notes).toEqual([newer]);
    });
  });

  describe('createNote', () => {
    it('adds the created note to the list', async () => {
      const { result } = await renderLoaded([older]);
      const created = fakeNote({ id: 'c', title: 'Fresh', updatedAt: '2026-08-24T09:00:00.000Z' });
      mocked.create.mockResolvedValue(created);

      await act(() => result.current.createNote({ title: 'Fresh' }));

      expect(result.current.notes).toEqual([created, older]);
    });
  });

  describe('renameNote', () => {
    it('sends only the title and re-sorts on the answer', async () => {
      const { result } = await renderLoaded([newer, older]);
      const renamed = { ...older, title: 'Renamed', updatedAt: '2026-08-24T09:00:00.000Z' };
      mocked.update.mockResolvedValue(renamed);

      await act(() => result.current.renameNote('a', 'Renamed'));

      expect(mocked.update).toHaveBeenCalledWith('a', { title: 'Renamed' });
      // the rename made it the most recently touched, so it goes first
      expect(result.current.notes).toEqual([renamed, newer]);
    });

    it('rejects to the caller instead of setting the page error', async () => {
      const { result } = await renderLoaded();
      mocked.update.mockRejectedValue(new ApiError(404, 'Note not found'));

      await expect(act(() => result.current.renameNote('a', 'x'))).rejects.toThrow(
        'Note not found',
      );
      expect(result.current.error).toBeNull();
    });
  });

  describe('duplicateNote', () => {
    it('copies the content under a "Copy of" title', async () => {
      const { result } = await renderLoaded([older]);
      mocked.create.mockResolvedValue(fakeNote({ id: 'copy' }));

      await act(() => result.current.duplicateNote(older));

      expect(mocked.create).toHaveBeenCalledWith({
        title: 'Copy of Older',
        content: older.content,
      });
    });

    it('keeps the copied title inside the length the server accepts', async () => {
      const long = fakeNote({ title: 'a'.repeat(200) });
      const { result } = await renderLoaded([long]);
      mocked.create.mockResolvedValue(fakeNote({ id: 'copy' }));

      await act(() => result.current.duplicateNote(long));

      const sent = mocked.create.mock.calls[0][0];
      expect(sent.title).toHaveLength(200);
      expect(sent.title.startsWith('Copy of ')).toBe(true);
    });
  });

  describe('deleteNote', () => {
    it('drops the note from the list', async () => {
      const { result } = await renderLoaded([newer, older]);
      mocked.remove.mockResolvedValue(undefined);

      await act(() => result.current.deleteNote('a'));

      expect(result.current.notes).toEqual([newer]);
    });

    it('leaves the list alone when the server refuses', async () => {
      const { result } = await renderLoaded([newer, older]);
      mocked.remove.mockRejectedValue(new ApiError(404, 'Note not found'));

      await expect(act(() => result.current.deleteNote('a'))).rejects.toThrow('Note not found');
      expect(result.current.notes).toEqual([newer, older]);
    });
  });
});
