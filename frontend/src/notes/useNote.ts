import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { type Note, notesApi } from '../api/notes';

export interface UseNoteResult {
  note: Note | null;
  isLoading: boolean;
  error: string | null;
  isMissing: boolean;
}

export function useNote(id: string | undefined): UseNoteResult {
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(id !== undefined);
  const [error, setError] = useState<string | null>(null);
  const [isMissing, setIsMissing] = useState(false);
  const [loadedId, setLoadedId] = useState(id);

  if (id !== loadedId) {
    setLoadedId(id);
    setNote(null);
    setIsLoading(id !== undefined);
    setError(null);
    setIsMissing(false);
  }

  const load = useCallback((noteId: string) => {
    return notesApi
      .get(noteId)
      .then(setNote)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setIsMissing(true);
        }
        setError(err instanceof Error ? err.message : 'Could not open that note.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (id !== undefined) {
      void load(id);
    }
  }, [id, load]);

  return { note, isLoading, error, isMissing };
}
