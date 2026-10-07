import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, date, uuid, validNote, validRegistration, validTag } from '../src/validation.js';
import { note, tag } from './helpers.js';

test('uuid accepts RFC 4122 identifiers only', () => {
  assert.equal(uuid('3f2b8c1e-4d5a-4b6c-9d7e-8f9a0b1c2d3e'), true);
  assert.equal(uuid('3F2B8C1E-4D5A-4B6C-9D7E-8F9A0B1C2D3E'), true);
  assert.equal(uuid('3f2b8c1e-4d5a-9b6c-9d7e-8f9a0b1c2d3e'), false, 'version 9 is invalid');
  assert.equal(uuid('3f2b8c1e-4d5a-4b6c-cd7e-8f9a0b1c2d3e'), false, 'variant c is invalid');
  assert.equal(uuid('not-a-uuid'), false);
  assert.equal(uuid(42), false);
});

test('date accepts parseable strings only', () => {
  assert.equal(date('2026-10-07T12:00:00.000Z'), true);
  assert.equal(date('yesterday'), false);
  assert.equal(date(Date.now()), false);
});

test('validNote enforces required fields and length limits', () => {
  assert.equal(validNote(note()), true);
  assert.equal(validNote(note({ content: 'a'.repeat(LIMITS.noteContent) })), true);
  assert.equal(validNote(note({ content: 'a'.repeat(LIMITS.noteContent + 1) })), false);
  assert.equal(validNote(note({ title: 'a'.repeat(201) })), false);
  assert.equal(validNote(note({ title: '   ' })), false);
  assert.equal(validNote(note({ content: '' })), false);
  assert.equal(validNote(note({ tags: ['not-a-uuid'] })), false);
  assert.equal(validNote(note({ active: 'yes' })), false);
  assert.equal(validNote(note({ createdAt: 'later' })), false);
  assert.equal(validNote(null), false);
});

test('validTag enforces name, color range and dates', () => {
  assert.equal(validTag(tag()), true);
  assert.equal(validTag(tag({ color: 0 })), true);
  assert.equal(validTag(tag({ color: 8 })), true);
  assert.equal(validTag(tag({ color: 9 })), false);
  assert.equal(validTag(tag({ color: 1.5 })), false);
  assert.equal(validTag(tag({ name: 'a'.repeat(101) })), false);
  assert.equal(validTag(tag({ name: ' ' })), false);
  assert.equal(validTag(tag({ updatedAt: undefined })), false);
  assert.equal(validTag(undefined), false);
});

test('validRegistration requires an email and an 8 to 72 character password', () => {
  assert.equal(validRegistration('user@notely.test', 'password1'), true);
  assert.equal(validRegistration('user@notely', 'password1'), false);
  assert.equal(validRegistration('user@notely.test', 'short'), false);
  assert.equal(validRegistration('user@notely.test', 'a'.repeat(73)), false);
  assert.equal(validRegistration('user@notely.test', 12345678), false);
  assert.equal(validRegistration(`${'a'.repeat(250)}@x.io`, 'password1'), false);
});
