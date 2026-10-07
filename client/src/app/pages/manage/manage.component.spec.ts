import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { OrderType, OrderValue } from 'src/app/utils/interfaces/iorder';
import { DataService } from 'src/app/utils/services/data.service';
import { NoteService } from 'src/app/utils/services/note.service';
import { TagService } from 'src/app/utils/services/tag.service';
import { makeNote, makeTag } from 'src/app/utils/testing';
import { ManageComponent, ViewMode } from './manage.component';

describe('ManageComponent', () => {
  const home = makeTag({ name: 'Home', createdAt: new Date('2026-01-02') });
  const art = makeTag({ name: 'Art', createdAt: new Date('2026-01-01') });
  const notes = [
    makeNote({ title: 'Banana', tags: [home.id], createdAt: new Date('2026-03-01') }),
    makeNote({ title: 'Apple', createdAt: new Date('2026-02-01') }),
    makeNote({ title: 'Cherry', tags: [home.id], createdAt: new Date('2026-04-01') }),
  ];
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let changed: BehaviorSubject<void>;

  function create(type = 'note') {
    params = new BehaviorSubject(convertToParamMap({ type }));
    changed = new BehaviorSubject<void>(undefined);
    const data = { notes: [...notes], tags: [home, art], changed } as unknown as DataService;
    const component = new ManageComponent(new NoteService(data), data, new TagService(data), { paramMap: params } as unknown as ActivatedRoute);
    component.ngOnInit();
    return component;
  }

  beforeEach(() => {
    localStorage.removeItem('viewMode');
    spyOn(window, 'scrollTo');
  });

  it('loads notes and tags and defaults to list view', () => {
    const component = create();

    expect(component.notes.length).toBe(3);
    expect(component.tags.length).toBe(2);
    expect(component.viewMode).toBe(ViewMode.LIST);
  });

  it('restores the stored view mode', () => {
    localStorage.setItem('viewMode', String(ViewMode.GRID));

    expect(create().viewMode).toBe(ViewMode.GRID);
    localStorage.removeItem('viewMode');
  });

  it('filters notes by text and tag, and tags by name', () => {
    const component = create();

    component.loadFilteredList({ text: 'nan', tag: home });
    expect(component.notes.map(note => note.title)).toEqual(['Banana']);

    params.next(convertToParamMap({ type: 'tag' }));
    component.loadFilteredList({ text: 'ar', tag: null });
    expect(component.tags.map(tag => tag.name)).toEqual(['Art']);
  });

  it('keeps each view filtered when switching between notes and tags', () => {
    const component = create();
    component.loadFilteredList({ text: 'cherry', tag: null });

    params.next(convertToParamMap({ type: 'tag' }));
    params.next(convertToParamMap({ type: 'note' }));

    expect(component.notes.map(note => note.title)).toEqual(['Cherry']);
  });

  it('orders notes and tags by name and creation date', () => {
    const component = create();

    component.orderList({ type: OrderType.NoteTitle, value: OrderValue.ASC });
    expect(component.notes.map(note => note.title)).toEqual(['Apple', 'Banana', 'Cherry']);
    component.orderList({ type: OrderType.CreatedAt, value: OrderValue.DESC });
    expect(component.notes.map(note => note.title)).toEqual(['Cherry', 'Banana', 'Apple']);
    component.orderList({ type: OrderType.TagName, value: OrderValue.DESC });
    expect(component.tags.map(tag => tag.name)).toEqual(['Home', 'Art']);

    params.next(convertToParamMap({ type: 'tag' }));
    component.orderList({ type: OrderType.CreatedAt, value: OrderValue.ASC });
    expect(component.tags.map(tag => tag.name)).toEqual(['Art', 'Home']);
  });

  it('opens the manage modal for an item and closes it', () => {
    const component = create();

    component.toggleManageModal(notes[0]);
    expect(component.showManageModal).toBeTrue();
    expect(component.currentNote).toBe(notes[0]);

    component.toggleManageModal();
    expect(component.showManageModal).toBeFalse();
  });
});
