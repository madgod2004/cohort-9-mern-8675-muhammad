import { expect } from 'chai';
import { Types } from 'mongoose';

import { noteRepository } from '../src/repositories/note.repository';

const alice = new Types.ObjectId().toString();
const bob = new Types.ObjectId().toString();

function note(owner: string, title = 'Note', content = '<p>body</p>') {
  return noteRepository.create({ title, content, owner });
}

describe('note repository', () => {
  describe('listByOwner', () => {
    it('returns only notes belonging to the owner', async () => {
      await note(alice, 'Alice note');
      await note(bob, 'Bob note');

      const notes = await noteRepository.listByOwner(alice);

      expect(notes).to.have.lengthOf(1);
      expect(notes[0]?.title).to.equal('Alice note');
    });

    it('returns an empty array when the owner has none', async () => {
      await note(bob);

      expect(await noteRepository.listByOwner(alice)).to.deep.equal([]);
    });

    it('sorts most recently updated first', async () => {
      const first = await note(alice, 'Older');
      const second = await note(alice, 'Newer');

      await new Promise((resolve) => setTimeout(resolve, 10));

      first.title = 'Older, now touched';
      const saved = await noteRepository.save(first);
      expect(saved.updatedAt.getTime()).to.be.greaterThan(second.updatedAt.getTime());

      const notes = await noteRepository.listByOwner(alice);
      expect(notes[0]?.title).to.equal('Older, now touched');
    });
  });

  describe('findByIdForOwner', () => {
    it('finds a note the owner owns', async () => {
      const created = await note(alice, 'Mine');

      const found = await noteRepository.findByIdForOwner(created._id.toString(), alice);

      expect(found?.title).to.equal('Mine');
    });

    it('returns null for a note owned by someone else', async () => {
      const created = await note(alice);

      expect(await noteRepository.findByIdForOwner(created._id.toString(), bob)).to.be.null;
    });

    it('returns null for a malformed id instead of throwing', async () => {
      expect(await noteRepository.findByIdForOwner('not-an-object-id', alice)).to.be.null;
    });

    it('returns null for a well-formed id that does not exist', async () => {
      const missing = new Types.ObjectId().toString();

      expect(await noteRepository.findByIdForOwner(missing, alice)).to.be.null;
    });
  });

  describe('save', () => {
    it('re-runs the model hook so updated content is sanitised', async () => {
      const created = await note(alice, 'Mine', '<p>clean</p>');

      created.content = '<p>changed</p><script>alert(1)</script>';
      const saved = await noteRepository.save(created);

      expect(saved.content).to.not.include('script');
      expect(saved.contentText).to.equal('changed');
    });
  });

  describe('deleteByIdForOwner', () => {
    it('deletes a note the owner owns', async () => {
      const created = await note(alice);

      const deleted = await noteRepository.deleteByIdForOwner(created._id.toString(), alice);

      expect(deleted).to.not.be.null;
      expect(await noteRepository.listByOwner(alice)).to.deep.equal([]);
    });

    it('does not delete a note owned by someone else', async () => {
      const created = await note(alice);

      const deleted = await noteRepository.deleteByIdForOwner(created._id.toString(), bob);

      expect(deleted).to.be.null;
      expect(await noteRepository.listByOwner(alice)).to.have.lengthOf(1);
    });

    it('returns null for a malformed id', async () => {
      expect(await noteRepository.deleteByIdForOwner('not-an-object-id', alice)).to.be.null;
    });
  });
});
