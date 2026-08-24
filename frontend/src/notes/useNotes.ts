import { useCallback, useEffect, useRef, useState } from 'react';

import { type CreateNoteInput, type Note, notesApi } from '../api/notes';

const MAX_TITLE_LENGTH = 200;
const COPY_PREFIX = 'Copy of ';

function messageFrom(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function newestFirst(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function copyTitle(title: string): string {
  return `${COPY_PREFIX}${title}`.slice(0, MAX_TITLE_LENGTH);
}

export interface UseNotesResult {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  createNote: (input: CreateNoteInput) => Promise<Note>;
  renameNote: (id: string, title: string) => Promise<Note>;
  duplicateNote: (note: Note) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
}

export function useNotes(): UseNotesResult {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // a reload started later must win, even if it answers first
  const latestRequest = useRef(0);

  const load = useCallback(() => {
    const requestId = ++latestRequest.current;
    const isCurrent = () => requestId === latestRequest.current;

    return notesApi
      .list()
      .then((fetched) => {
        if (isCurrent()) setNotes(fetched);
      })
      .catch((err: unknown) => {
        if (isCurrent()) setError(messageFrom(err, 'Could not load your notes.'));
      })
      .finally(() => {
        if (isCurrent()) setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await load();
  }, [load]);

  // replaces the note if it is already listed, adds it if it is not
  const upsert = useCallback((note: Note) => {
    setNotes((prev) => newestFirst([note, ...prev.filter((n) => n.id !== note.id)]));
    return note;
  }, []);

  const createNote = useCallback(
    async (input: CreateNoteInput) => upsert(await notesApi.create(input)),
    [upsert],
  );

  const renameNote = useCallback(
    async (id: string, title: string) => upsert(await notesApi.update(id, { title })),
    [upsert],
  );

  const duplicateNote = useCallback(
    async (note: Note) =>
      upsert(await notesApi.create({ title: copyTitle(note.title), content: note.content })),
    [upsert],
  );

  const deleteNote = useCallback(async (id: string) => {
    await notesApi.remove(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notes,
    isLoading,
    error,
    reload,
    createNote,
    renameNote,
    duplicateNote,
    deleteNote,
  };
}
