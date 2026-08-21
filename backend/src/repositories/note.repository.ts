import { type HydratedDocument, Types } from 'mongoose';

import { type INote, Note } from '../models/Note';

export type NoteDocument = HydratedDocument<INote>;

export const noteRepository = {
  listByOwner(ownerId: string): Promise<NoteDocument[]> {
    return Note.find({ owner: ownerId }).sort({ updatedAt: -1 }).exec();
  },

  findByIdForOwner(id: string, ownerId: string): Promise<NoteDocument | null> {
    // a malformed id would make Mongoose throw rather than return null
    if (!Types.ObjectId.isValid(id)) {
      return Promise.resolve(null);
    }
    return Note.findOne({ _id: id, owner: ownerId }).exec();
  },

  create(data: { title: string; content: string; owner: string }): Promise<NoteDocument> {
    return Note.create(data);
  },

  save(note: NoteDocument): Promise<NoteDocument> {
    return note.save();
  },

  deleteByIdForOwner(id: string, ownerId: string): Promise<NoteDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return Promise.resolve(null);
    }
    return Note.findOneAndDelete({ _id: id, owner: ownerId }).exec();
  },
};
