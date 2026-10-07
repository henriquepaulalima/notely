import { after, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS } from '../src/validation.js';
import { closePool, dbSkip, note, resetDatabase, send, signUp, tag, testApp } from './helpers.js';

describe('data', { skip: dbSkip }, () => {
  let app;
  let cookie;
  beforeEach(async () => {
    await resetDatabase();
    app = await testApp();
    ({ cookie } = await signUp(app));
  });
  after(async () => {
    await app?.close();
    await closePool();
  });

  const getData = async (session = cookie) => (await send(app, 'GET', '/data', { cookie: session })).json();

  test('notes and tags can be created, updated and deleted', async () => {
    const newTag = tag();
    const newNote = note({ tags: [newTag.id] });

    assert.equal((await send(app, 'PUT', `/data/tags/${newTag.id}`, { cookie, body: newTag })).statusCode, 200);
    assert.equal((await send(app, 'PUT', `/data/notes/${newNote.id}`, { cookie, body: newNote })).statusCode, 200);
    const updated = { ...newNote, title: 'Updated', updatedAt: new Date().toISOString() };
    await send(app, 'PUT', `/data/notes/${newNote.id}`, { cookie, body: updated });

    let data = await getData();
    assert.equal(data.notes.length, 1);
    assert.equal(data.notes[0].title, 'Updated');
    assert.deepEqual(data.notes[0].tags, [newTag.id]);
    assert.equal(data.tags[0].name, newTag.name);

    assert.equal((await send(app, 'DELETE', `/data/notes/${newNote.id}`, { cookie })).statusCode, 204);
    assert.equal((await send(app, 'DELETE', `/data/tags/${newTag.id}`, { cookie })).statusCode, 204);
    data = await getData();
    assert.deepEqual(data, { notes: [], tags: [] });
  });

  test('invalid items and mismatched ids are rejected', async () => {
    const item = note();

    assert.equal((await send(app, 'PUT', '/data/notes/other-id', { cookie, body: item })).statusCode, 400);
    assert.equal((await send(app, 'PUT', `/data/notes/${item.id}`, { cookie, body: { ...item, content: '' } })).statusCode, 400);
    assert.equal((await send(app, 'DELETE', '/data/notes/not-a-uuid', { cookie })).statusCode, 400);
  });

  test("a user cannot overwrite or delete another user's note", async () => {
    const shared = note({ title: 'Mine' });
    await send(app, 'PUT', `/data/notes/${shared.id}`, { cookie, body: shared });
    const { cookie: otherCookie } = await signUp(app);

    await send(app, 'PUT', `/data/notes/${shared.id}`, { cookie: otherCookie, body: { ...shared, title: 'Stolen' } });
    await send(app, 'DELETE', `/data/notes/${shared.id}`, { cookie: otherCookie });

    assert.equal((await getData()).notes[0].title, 'Mine');
    assert.deepEqual((await getData(otherCookie)).notes, []);
  });

  test('import saves local notes and tags and returns the account data', async () => {
    const tags = [tag(), tag()];
    const notes = [note({ tags: [tags[0].id] })];

    const response = await send(app, 'POST', '/data/import', { cookie, body: { notes, tags } });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().notes.length, 1);
    assert.equal(response.json().tags.length, 2);
  });

  test('import rejects arrays above the account limits', async () => {
    const notes = Array.from({ length: LIMITS.notes + 1 }, () => note());

    const response = await send(app, 'POST', '/data/import', { cookie, body: { notes, tags: [] } });

    assert.equal(response.statusCode, 400);
  });

  test('an import over the storage quota saves nothing', async () => {
    const notes = Array.from({ length: 300 }, () => note({ content: 'b'.repeat(LIMITS.noteContent - 10) }));

    const response = await send(app, 'POST', '/data/import', { cookie, body: { notes, tags: [] } });

    assert.equal(response.statusCode, 413);
    assert.match(response.json().error, /Storage limit reached/);
    assert.deepEqual((await getData()).notes, []);
  });

  test('saving beyond the note count limit returns 413', async () => {
    const notes = Array.from({ length: LIMITS.notes }, () => note());
    await send(app, 'POST', '/data/import', { cookie, body: { notes, tags: [] } });
    const extra = note();

    const response = await send(app, 'PUT', `/data/notes/${extra.id}`, { cookie, body: extra });

    assert.equal(response.statusCode, 413);
    assert.equal((await getData()).notes.length, LIMITS.notes);
  });

  test('saving beyond the tag count limit returns 413', async () => {
    const tags = Array.from({ length: LIMITS.tags }, () => tag());
    await send(app, 'POST', '/data/import', { cookie, body: { notes: [], tags } });
    const extra = tag();

    const response = await send(app, 'PUT', `/data/tags/${extra.id}`, { cookie, body: extra });

    assert.equal(response.statusCode, 413);
  });

  test('editing an existing note at the limit still works', async () => {
    const notes = Array.from({ length: LIMITS.notes }, () => note());
    await send(app, 'POST', '/data/import', { cookie, body: { notes, tags: [] } });

    const response = await send(app, 'PUT', `/data/notes/${notes[0].id}`, { cookie, body: { ...notes[0], title: 'Edited' } });

    assert.equal(response.statusCode, 200);
  });
});
