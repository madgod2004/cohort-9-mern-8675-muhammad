import type { Request, Response } from 'express';

import type { CreateNoteInput, UpdateNoteInput } from '../schemas/note.schema';
import * as noteService from '../services/note.service';

function ownerId(req: Request): string {
  return req.user!.id;
}

function noteId(req: Request): string {
  const id = req.params.id;
  return typeof id === 'string' ? id : '';
}

export async function list(req: Request, res: Response): Promise<void> {
  const notes = await noteService.listNotes(ownerId(req));
  res.status(200).json({ notes });
}

export async function get(req: Request, res: Response): Promise<void> {
  const note = await noteService.getNote(noteId(req), ownerId(req));
  res.status(200).json({ note });
}

export async function create(req: Request, res: Response): Promise<void> {
  const note = await noteService.createNote(req.body as CreateNoteInput, ownerId(req));
  res.status(201).json({ note });
}

export async function update(req: Request, res: Response): Promise<void> {
  const note = await noteService.updateNote(noteId(req), req.body as UpdateNoteInput, ownerId(req));
  res.status(200).json({ note });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await noteService.deleteNote(noteId(req), ownerId(req));
  res.status(204).send();
}
