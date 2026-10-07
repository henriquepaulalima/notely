import { INote } from './interfaces/inote';
import { ITag, TagColors } from './interfaces/itag';

let counter = 0;
const id = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`;

export const makeNote = (overrides: Partial<INote> = {}): INote => ({
  id: id(), title: 'Groceries', content: 'Milk and bread', tags: [], active: true,
  createdAt: new Date('2026-10-01T10:00:00Z'), updatedAt: new Date('2026-10-01T10:00:00Z'), ...overrides,
});

export const makeTag = (overrides: Partial<ITag> = {}): ITag => ({
  id: id(), name: 'Home', color: TagColors.EMERALD, active: true,
  createdAt: new Date('2026-10-01T10:00:00Z'), updatedAt: new Date('2026-10-01T10:00:00Z'), ...overrides,
});
