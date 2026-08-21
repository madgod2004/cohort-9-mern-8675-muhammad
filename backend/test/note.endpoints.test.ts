import { expect } from 'chai';
import request from 'supertest';

import app from '../src/app';

type Agent = ReturnType<typeof request.agent>;

async function signedInAs(email: string): Promise<Agent> {
  const agent = request.agent(app);
  await agent.post('/api/auth/signup').send({ email, password: 'supersecret', name: 'Test User' });
  return agent;
}

async function createNote(agent: Agent, title = 'Meeting', content = '<p>body</p>') {
  const res = await agent.post('/api/notes').send({ title, content });
  return res.body.note as { id: string; title: string; content: string; contentText: string };
}

describe('notes API', () => {
  let alice: Agent;
  let bob: Agent;

  beforeEach(async () => {
    alice = await signedInAs('alice@example.com');
    bob = await signedInAs('bob@example.com');
  });

  describe('authentication', () => {
    it('rejects every notes route without a session', async () => {
      const id = '000000000000000000000000';
      const responses = await Promise.all([
        request(app).get('/api/notes'),
        request(app).post('/api/notes').send({ title: 'x' }),
        request(app).get(`/api/notes/${id}`),
        request(app).patch(`/api/notes/${id}`).send({ title: 'x' }),
        request(app).delete(`/api/notes/${id}`),
      ]);

      expect(responses.map((r) => r.status)).to.deep.equal([401, 401, 401, 401, 401]);
    });
  });

  describe('POST /api/notes', () => {
    it('creates a note and returns 201', async () => {
      const res = await alice.post('/api/notes').send({ title: 'Meeting', content: '<p>hi</p>' });

      expect(res.status).to.equal(201);
      expect(res.body.note.title).to.equal('Meeting');
      expect(res.body.note.id).to.be.a('string');
    });

    it('strips dangerous html and derives contentText', async () => {
      const note = await createNote(
        alice,
        'Unsafe',
        '<h2>Plan</h2><p>go</p><script>alert(1)</script>',
      );

      expect(note.content).to.not.include('script');
      expect(note.contentText).to.equal('Plan go');
    });

    it('defaults content to an empty string', async () => {
      const res = await alice.post('/api/notes').send({ title: 'Just a title' });

      expect(res.status).to.equal(201);
      expect(res.body.note.content).to.equal('');
    });

    it('rejects a missing title with 400', async () => {
      const res = await alice.post('/api/notes').send({ content: '<p>no title</p>' });

      expect(res.status).to.equal(400);
    });

    it('does not expose the owner', async () => {
      const note = await createNote(alice);

      expect(note).to.not.have.property('owner');
    });
  });

  describe('GET /api/notes', () => {
    it('returns only the signed-in user notes', async () => {
      await createNote(alice, 'Alice note');
      await createNote(bob, 'Bob note');

      const res = await alice.get('/api/notes');

      expect(res.status).to.equal(200);
      expect(res.body.notes).to.have.lengthOf(1);
      expect(res.body.notes[0].title).to.equal('Alice note');
    });

    it('returns an empty list for a user with no notes', async () => {
      await createNote(alice);

      const res = await bob.get('/api/notes');

      expect(res.body.notes).to.deep.equal([]);
    });
  });

  describe('GET /api/notes/:id', () => {
    it('returns the note to its owner', async () => {
      const note = await createNote(alice, 'Mine');

      const res = await alice.get(`/api/notes/${note.id}`);

      expect(res.status).to.equal(200);
      expect(res.body.note.title).to.equal('Mine');
    });

    it('returns 404 for another user note', async () => {
      const note = await createNote(alice);

      const res = await bob.get(`/api/notes/${note.id}`);

      expect(res.status).to.equal(404);
    });

    it('returns the same 404 for a note that does not exist', async () => {
      const note = await createNote(alice);

      const foreign = await bob.get(`/api/notes/${note.id}`);
      const missing = await bob.get('/api/notes/000000000000000000000000');

      expect(foreign.status).to.equal(missing.status);
      expect(foreign.body.error.message).to.equal(missing.body.error.message);
    });

    it('returns 404 rather than 500 for a malformed id', async () => {
      const res = await alice.get('/api/notes/not-an-object-id');

      expect(res.status).to.equal(404);
    });
  });

  describe('PATCH /api/notes/:id', () => {
    it('updates the title only', async () => {
      const note = await createNote(alice, 'Old', '<p>keep</p>');

      const res = await alice.patch(`/api/notes/${note.id}`).send({ title: 'New' });

      expect(res.status).to.equal(200);
      expect(res.body.note.title).to.equal('New');
      expect(res.body.note.content).to.equal('<p>keep</p>');
    });

    it('re-sanitises content on update', async () => {
      const note = await createNote(alice);

      const res = await alice
        .patch(`/api/notes/${note.id}`)
        .send({ content: '<p>new</p><img src=x onerror=hack>' });

      expect(res.body.note.content).to.not.include('onerror');
      expect(res.body.note.contentText).to.equal('new');
    });

    it('rejects an empty body with 400', async () => {
      const note = await createNote(alice);

      const res = await alice.patch(`/api/notes/${note.id}`).send({});

      expect(res.status).to.equal(400);
    });

    it('returns 404 when updating another user note', async () => {
      const note = await createNote(alice, 'Original');

      const res = await bob.patch(`/api/notes/${note.id}`).send({ title: 'Hacked' });

      expect(res.status).to.equal(404);

      const check = await alice.get(`/api/notes/${note.id}`);
      expect(check.body.note.title).to.equal('Original');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('deletes the note and returns 204', async () => {
      const note = await createNote(alice);

      const res = await alice.delete(`/api/notes/${note.id}`);

      expect(res.status).to.equal(204);
      expect((await alice.get(`/api/notes/${note.id}`)).status).to.equal(404);
    });

    it('returns 404 when deleting another user note', async () => {
      const note = await createNote(alice);

      const res = await bob.delete(`/api/notes/${note.id}`);

      expect(res.status).to.equal(404);
      expect((await alice.get(`/api/notes/${note.id}`)).status).to.equal(200);
    });
  });
});
