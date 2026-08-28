import { act, renderHook, waitFor } from '@testing-library/react';

import { fakeNote } from '../../test/factories';
import { ApiError } from '../api/client';
import { notesApi } from '../api/notes';
import { useNote } from './useNote';

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

/** a promise whose settling this test controls */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const groceries = fakeNote({ id: 'a', title: 'Groceries' });
const trip = fakeNote({ id: 'b', title: 'Trip planning' });

describe('useNote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('creating, where there is no id', () => {
    it('waits for nothing and asks the server for nothing', () => {
      const { result } = renderHook(() => useNote(undefined));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.note).toBeNull();
      expect(mocked.get).not.toHaveBeenCalled();
    });
  });

  describe('editing an existing note', () => {
    it('loads it', async () => {
      mocked.get.mockResolvedValue(groceries);

      const { result } = renderHook(() => useNote('a'));
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(mocked.get).toHaveBeenCalledWith('a');
      expect(result.current.note).toEqual(groceries);
      expect(result.current.error).toBeNull();
    });

    it('marks a 404 as missing, so the page can say so plainly', async () => {
      mocked.get.mockRejectedValue(new ApiError(404, 'Note not found'));

      const { result } = renderHook(() => useNote('gone'));

      await waitFor(() => expect(result.current.error).toBe('Note not found'));
      expect(result.current.isMissing).toBe(true);
    });

    it('does not call anything else missing', async () => {
      mocked.get.mockRejectedValue(new ApiError(500, 'Something went wrong.'));

      const { result } = renderHook(() => useNote('a'));

      await waitFor(() => expect(result.current.error).toBe('Something went wrong.'));
      expect(result.current.isMissing).toBe(false);
    });
  });

  describe('when the id changes', () => {
    it('fetches the new note', async () => {
      mocked.get.mockResolvedValueOnce(groceries).mockResolvedValueOnce(trip);
      const { result, rerender } = renderHook(({ id }) => useNote(id), {
        initialProps: { id: 'a' as string | undefined },
      });
      await waitFor(() => expect(result.current.note).toEqual(groceries));

      rerender({ id: 'b' });

      await waitFor(() => expect(result.current.note).toEqual(trip));
      expect(mocked.get).toHaveBeenLastCalledWith('b');
    });

    it('drops the previous note straight away rather than showing it under the new id', async () => {
      mocked.get.mockResolvedValueOnce(groceries).mockReturnValueOnce(new Promise(() => {}));
      const { result, rerender } = renderHook(({ id }) => useNote(id), {
        initialProps: { id: 'a' as string | undefined },
      });
      await waitFor(() => expect(result.current.note).toEqual(groceries));

      rerender({ id: 'b' });

      expect(result.current.note).toBeNull();
      expect(result.current.isLoading).toBe(true);
    });

    it('ignores a slow first note that answers after the second', async () => {
      const first = deferred<typeof groceries>();
      const second = deferred<typeof groceries>();
      mocked.get.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

      const { result, rerender } = renderHook(({ id }) => useNote(id), {
        initialProps: { id: 'a' as string | undefined },
      });
      rerender({ id: 'b' });

      await act(async () => {
        second.resolve(trip);
        await second.promise;
      });
      await act(async () => {
        first.resolve(groceries);
        await first.promise;
      });

      expect(result.current.note).toEqual(trip);
    });

    it('clears a previous error when moving to another note', async () => {
      mocked.get.mockRejectedValueOnce(new ApiError(404, 'Note not found'));
      const { result, rerender } = renderHook(({ id }) => useNote(id), {
        initialProps: { id: 'gone' as string | undefined },
      });
      await waitFor(() => expect(result.current.isMissing).toBe(true));

      mocked.get.mockResolvedValueOnce(trip);
      rerender({ id: 'b' });

      expect(result.current.error).toBeNull();
      expect(result.current.isMissing).toBe(false);
    });
  });
});
