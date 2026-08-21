import { expect } from 'chai';
import sinon from 'sinon';

import { AppError } from '../src/errors/AppError';
import { type NoteDocument, noteRepository } from '../src/repositories/note.repository';
import * as noteService from '../src/services/note.service';

const OWNER = 'owner-id-1';
const OTHER = 'owner-id-2';

function fakeNote(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'note-id-1' },
    title: 'Meeting',
    content: '<p>body</p>',
    contentText: 'body',
    owner: OWNER,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    ...overrides,
  } as unknown as NoteDocument;
}

async function captureError(fn: () => Promise<unknown>): Promise<AppError> {
  try {
    await fn();
  } catch (err) {
    return err as AppError;
  }
  throw new Error('expected the call to reject, but it resolved');
}

describe('note service', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('listNotes', () => {
    it('returns the owner notes in public shape', async () => {
      sinon.stub(noteRepository, 'listByOwner').resolves([fakeNote()]);

      const notes = await noteService.listNotes(OWNER);

      expect(notes).to.have.lengthOf(1);
      expect(notes[0]).to.deep.equal({
        id: 'note-id-1',
        title: 'Meeting',
        content: '<p>body</p>',
        contentText: 'body',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      });
    });

    it('passes the owner id through to the repository', async () => {
      const list = sinon.stub(noteRepository, 'listByOwner').resolves([]);

      await noteService.listNotes(OWNER);

      expect(list.firstCall.args[0]).to.equal(OWNER);
    });

    it('never exposes the owner field', async () => {
      sinon.stub(noteRepository, 'listByOwner').resolves([fakeNote()]);

      const notes = await noteService.listNotes(OWNER);

      expect(notes[0]).to.not.have.property('owner');
    });
  });

  describe('getNote', () => {
    it('returns the note when the owner matches', async () => {
      sinon.stub(noteRepository, 'findByIdForOwner').resolves(fakeNote());

      expect((await noteService.getNote('note-id-1', OWNER)).title).to.equal('Meeting');
    });

    it('rejects with 404 when the repository finds nothing', async () => {
      sinon.stub(noteRepository, 'findByIdForOwner').resolves(null);

      const err = await captureError(() => noteService.getNote('note-id-1', OTHER));

      expect(err.statusCode).to.equal(404);
      expect(err.message).to.equal('Note not found');
    });
  });

  describe('createNote', () => {
    it('creates the note against the given owner', async () => {
      const create = sinon.stub(noteRepository, 'create').resolves(fakeNote());

      await noteService.createNote({ title: 'Meeting', content: '<p>body</p>' }, OWNER);

      expect(create.firstCall.args[0]).to.deep.equal({
        title: 'Meeting',
        content: '<p>body</p>',
        owner: OWNER,
      });
    });
  });

  describe('updateNote', () => {
    it('applies only the fields supplied', async () => {
      const note = fakeNote();
      sinon.stub(noteRepository, 'findByIdForOwner').resolves(note);
      const save = sinon.stub(noteRepository, 'save').resolves(note);

      await noteService.updateNote('note-id-1', { title: 'Renamed' }, OWNER);

      expect(note.title).to.equal('Renamed');
      expect(note.content).to.equal('<p>body</p>');
      expect(save.calledOnce).to.equal(true);
    });

    it('allows clearing the content to an empty string', async () => {
      const note = fakeNote();
      sinon.stub(noteRepository, 'findByIdForOwner').resolves(note);
      sinon.stub(noteRepository, 'save').resolves(note);

      await noteService.updateNote('note-id-1', { content: '' }, OWNER);

      expect(note.content).to.equal('');
    });

    it('saves the document so the sanitising hook runs', async () => {
      const note = fakeNote();
      sinon.stub(noteRepository, 'findByIdForOwner').resolves(note);
      const save = sinon.stub(noteRepository, 'save').resolves(note);

      await noteService.updateNote('note-id-1', { content: '<p>new</p>' }, OWNER);

      expect(save.firstCall.args[0]).to.equal(note);
    });

    it('rejects with 404 when the note is not the owner', async () => {
      sinon.stub(noteRepository, 'findByIdForOwner').resolves(null);
      const save = sinon.stub(noteRepository, 'save');

      const err = await captureError(() =>
        noteService.updateNote('note-id-1', { title: 'Hacked' }, OTHER),
      );

      expect(err.statusCode).to.equal(404);
      expect(save.called).to.equal(false);
    });
  });

  describe('deleteNote', () => {
    it('resolves when a note was deleted', async () => {
      sinon.stub(noteRepository, 'deleteByIdForOwner').resolves(fakeNote());

      await noteService.deleteNote('note-id-1', OWNER);
    });

    it('rejects with 404 when nothing was deleted', async () => {
      sinon.stub(noteRepository, 'deleteByIdForOwner').resolves(null);

      const err = await captureError(() => noteService.deleteNote('note-id-1', OTHER));

      expect(err.statusCode).to.equal(404);
    });
  });
});
