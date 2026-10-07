import { TagColors } from '../interfaces/itag';
import { makeNote, makeTag } from '../testing';
import { DataService } from './data.service';
import { NoteService } from './note.service';
import { TagService } from './tag.service';

describe('NoteService and TagService', () => {
  const home = makeTag({ name: 'Home' });
  const work = makeTag({ name: 'Work Projects' });
  const notes = [
    makeNote({ title: 'Groceries', content: 'Milk', tags: [home.id] }),
    makeNote({ title: 'Report', content: 'Quarterly numbers', tags: [work.id] }),
    makeNote({ title: 'Ideas', content: 'Home office layout', tags: [] }),
  ];
  let data: jasmine.SpyObj<DataService>;
  let noteService: NoteService;
  let tagService: TagService;

  beforeEach(() => {
    data = jasmine.createSpyObj<DataService>('DataService', ['put', 'remove'], { notes, tags: [home, work] });
    data.put.and.resolveTo();
    data.remove.and.resolveTo();
    noteService = new NoteService(data);
    tagService = new TagService(data);
  });

  it('saves, edits and deletes through the data service', async () => {
    await noteService.createNote(notes[0]);
    await noteService.editNote(notes[0]);
    await noteService.deleteNote(notes[0].id);
    await tagService.createTag(home);
    await tagService.editTag(home);
    await tagService.deleteTag(home.id);

    expect(data.put.calls.allArgs()).toEqual([['notes', notes[0]], ['notes', notes[0]], ['tags', home], ['tags', home]]);
    expect(data.remove.calls.allArgs()).toEqual([['notes', notes[0].id], ['tags', home.id]]);
  });

  it('filters notes by text in the title or content, case-insensitively', () => {
    expect(noteService.getFilteredNotes('HOME').map(note => note.title)).toEqual(['Ideas']);
    expect(noteService.getFilteredNotes('report').map(note => note.title)).toEqual(['Report']);
  });

  it('filters notes by tag, alone or combined with text', () => {
    expect(noteService.getFilteredNotes(null, home).map(note => note.title)).toEqual(['Groceries']);
    expect(noteService.getFilteredNotes('milk', work)).toEqual([]);
  });

  it('returns every note without filters', () => {
    expect(noteService.getFilteredNotes()).toEqual(notes);
    expect(noteService.getFilteredNotes('', null)).toEqual(notes);
  });

  it('filters tags by name', () => {
    expect(tagService.getFilteredTags('proj')).toEqual([work]);
    expect(tagService.getFilteredTags(null)).toEqual([home, work]);
  });

  it('validates UUIDs', () => {
    expect(noteService.isUUIDValid('6a7c5a52-4e4c-4da0-9594-167372a03720')).toBeTrue();
    expect(tagService.isUUIDValid('not-a-uuid')).toBeFalse();
  });

  it('maps every tag color to its swatch and rejects unknown colors', () => {
    const colors = tagService.getAllTagColors();

    expect(colors.length).toBe(9);
    for (const color of colors) expect(tagService.getSingleTagColor(color.id)).toBe(color.color);
    expect(tagService.getSingleTagColor(TagColors.EMERALD)).toBe('#257654');
    expect(() => tagService.getSingleTagColor(99 as TagColors)).toThrowError(/Cannot return color code/);
  });
});
