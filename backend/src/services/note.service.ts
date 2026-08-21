import { AppError } from '../errors/AppError';
import { type NoteDocument, noteRepository } from '../repositories/note.repository';
import type { CreateNoteInput, UpdateNoteInput } from '../schemas/note.schema';

export interface PublicNote {
  id: string;
  title: string;
  content: string;
  contentText: string;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicNote(note: NoteDocument): PublicNote {
  return {
    id: note._id.toString(),
    title: note.title,
    content: note.content,
    contentText: note.contentText,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

async function getOwnedNote(id: string, ownerId: string): Promise<NoteDocument> {
  const note = await noteRepository.findByIdForOwner(id, ownerId);
  if (!note) {
    throw new AppError(404, 'Note not found');
  }
  return note;
}

export async function listNotes(ownerId: string): Promise<PublicNote[]> {
  const notes = await noteRepository.listByOwner(ownerId);
  return notes.map(toPublicNote);
}

export async function getNote(id: string, ownerId: string): Promise<PublicNote> {
  return toPublicNote(await getOwnedNote(id, ownerId));
}

export async function createNote(input: CreateNoteInput, ownerId: string): Promise<PublicNote> {
  const note = await noteRepository.create({
    title: input.title,
    content: input.content,
    owner: ownerId,
  });
  return toPublicNote(note);
}

export async function updateNote(
  id: string,
  input: UpdateNoteInput,
  ownerId: string,
): Promise<PublicNote> {
  const note = await getOwnedNote(id, ownerId);

  if (input.title !== undefined) {
    note.title = input.title;
  }
  if (input.content !== undefined) {
    note.content = input.content;
  }

  return toPublicNote(await noteRepository.save(note));
}

export async function deleteNote(id: string, ownerId: string): Promise<void> {
  const deleted = await noteRepository.deleteByIdForOwner(id, ownerId);
  if (!deleted) {
    throw new AppError(404, 'Note not found');
  }
}
