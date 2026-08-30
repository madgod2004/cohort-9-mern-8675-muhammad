import { expect } from 'chai';
import type { HydratedDocument } from 'mongoose';

import { Note } from '../src/models/Note';
import { User, type IUser } from '../src/models/User';

describe('User model', () => {
  it('lowercases and trims the email on save', async () => {
    const user = await User.create({
      email: '  BOB@Example.COM  ',
      password: 'hashed-password',
      name: 'Bob',
    });

    expect(user.email).to.equal('bob@example.com');
  });

  it('hides the password unless explicitly selected', async () => {
    const user = await User.create({
      email: 'bob@example.com',
      password: 'plain-password',
      name: 'Bob',
    });

    const found = await User.findById(user._id);
    expect(found?.password).to.be.undefined;

    const withPassword = await User.findById(user._id).select('+password');
    expect(withPassword?.password).to.be.a('string');
  });

  it('hashes the password on save', async () => {
    const user = await User.create({
      email: 'bob@example.com',
      password: 'plain-password',
      name: 'Bob',
    });

    const withPassword = await User.findById(user._id).select('+password');
    expect(withPassword?.password).to.not.equal('plain-password');
    expect(withPassword?.password).to.match(/^\$2[aby]\$/);
  });

  it('compares a candidate password against the hash', async () => {
    const user = await User.create({
      email: 'bob@example.com',
      password: 'plain-password',
      name: 'Bob',
    });

    const withPassword = await User.findById(user._id).select('+password');
    expect(await withPassword?.comparePassword('plain-password')).to.equal(true);
    expect(await withPassword?.comparePassword('wrong-password')).to.equal(false);
  });

  it('does not rehash when other fields change', async () => {
    const user = await User.create({
      email: 'bob@example.com',
      password: 'plain-password',
      name: 'Bob',
    });

    const withPassword = await User.findById(user._id).select('+password');
    const originalHash = withPassword?.password;

    withPassword!.name = 'Robert';
    await withPassword!.save();

    expect(withPassword?.password).to.equal(originalHash);
  });

  it('rejects a duplicate email', async () => {
    await User.create({ email: 'bob@example.com', password: 'x', name: 'Bob' });

    let threw = false;
    try {
      await User.create({ email: 'bob@example.com', password: 'y', name: 'Bobby' });
    } catch {
      threw = true;
    }

    expect(threw).to.equal(true);
  });

  it('requires an email', async () => {
    let threw = false;
    try {
      await User.create({ password: 'x', name: 'Nameless' });
    } catch {
      threw = true;
    }

    expect(threw).to.equal(true);
  });
});

describe('Note model', () => {
  let owner: HydratedDocument<IUser>;

  beforeEach(async () => {
    owner = await User.create({
      email: 'owner@example.com',
      password: 'hashed-password',
      name: 'Owner',
    });
  });

  it('requires a title', async () => {
    let threw = false;
    try {
      await Note.create({ content: '<p>no title here</p>', owner: owner._id });
    } catch {
      threw = true;
    }

    expect(threw).to.equal(true);
  });

  it('requires an owner', async () => {
    let threw = false;
    try {
      await Note.create({ title: 'Orphan note' });
    } catch {
      threw = true;
    }

    expect(threw).to.equal(true);
  });

  it('strips dangerous html from content', async () => {
    const note = await Note.create({
      title: 'Unsafe',
      content: '<p>hello</p><script>alert(1)</script><img src=x onerror=alert(2)>',
      owner: owner._id,
    });

    expect(note.content).to.not.include('script');
    expect(note.content).to.not.include('onerror');
    expect(note.content).to.include('<p>hello</p>');
  });

  it('derives contentText with word breaks between blocks', async () => {
    const note = await Note.create({
      title: 'Meeting',
      content: '<h2>Plan</h2><p>Discuss the <strong>roadmap</strong></p>',
      owner: owner._id,
    });

    expect(note.contentText).to.equal('Plan Discuss the roadmap');
  });

  it('decodes html entities in contentText', async () => {
    const note = await Note.create({
      title: 'Entities',
      content: '<p>Tom &amp; Jerry</p>',
      owner: owner._id,
    });

    expect(note.contentText).to.equal('Tom & Jerry');
  });

  it('defaults content and contentText to empty strings', async () => {
    const note = await Note.create({ title: 'Empty', owner: owner._id });

    expect(note.content).to.equal('');
    expect(note.contentText).to.equal('');
  });

  it('populates the owner reference', async () => {
    const note = await Note.create({ title: 'Mine', owner: owner._id });

    const populated = await Note.findById(note._id).populate<{ owner: IUser }>('owner');
    expect(populated?.owner.name).to.equal('Owner');
  });
});
