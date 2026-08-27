import { api } from './client';

export interface Note {
  id: string;
  title: string;
  content: string;
  contentText: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
}

interface NoteResponse {
  note: Note;
}

interface NoteListResponse {
  notes: Note[];
}

const noteUrl = (id: string) => `/api/notes/${encodeURIComponent(id)}`;

export const notesApi = {
  list: () => api.get<NoteListResponse>('/api/notes').then((r) => r.notes),

  get: (id: string) => api.get<NoteResponse>(noteUrl(id)).then((r) => r.note),

  create: (input: CreateNoteInput) =>
    api.post<NoteResponse>('/api/notes', input).then((r) => r.note),

  update: (id: string, input: UpdateNoteInput) =>
    api.patch<NoteResponse>(noteUrl(id), input).then((r) => r.note),

  remove: (id: string) => api.delete<void>(noteUrl(id)),
};
