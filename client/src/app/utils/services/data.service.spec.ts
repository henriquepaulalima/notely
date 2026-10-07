import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService, User } from './auth.service';
import { DataService } from './data.service';

describe('DataService guest import', () => {
  let http: HttpTestingController;
  let data: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: {
        user: new BehaviorSubject<User | null>({ id: 'user-id', email: 'user@example.com' }),
      } }],
    });
    http = TestBed.inject(HttpTestingController);
    data = TestBed.inject(DataService);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('notes');
    localStorage.removeItem('tags');
  });

  it('imports guest tags with their note associations before clearing local storage', async () => {
    const tagId = '6a7c5a52-4e4c-4da0-9594-167372a03720';
    const tags = [{ id: tagId, name: 'Ideas', color: 0, active: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    const notes = [{ id: 'c72b841b-1ac3-4a92-af97-6ff36447e9e0', title: 'A note',
      content: 'Content', tags: [tagId], active: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('tags', JSON.stringify(tags));

    const importPromise = data.loadAndImport();
    const request = http.expectOne(`${environment.apiUrl}/data/import`);
    expect(request.request.body).toEqual({ notes, tags });
    expect(localStorage.getItem('tags')).not.toBeNull();
    request.flush({ notes, tags });
    await importPromise;

    expect(data.notes[0].tags).toEqual([tagId]);
    expect(data.tags[0].id).toBe(tagId);
    expect(localStorage.getItem('notes')).toBeNull();
    expect(localStorage.getItem('tags')).toBeNull();
  });

  it('loads account data without importing when there is nothing stored locally', async () => {
    const loading = data.loadAndImport();
    http.expectOne(`${environment.apiUrl}/data`).flush({ notes: [], tags: [] });
    await loading;

    expect(data.notes).toEqual([]);
  });

  it('saves and removes items through the API while signed in', async () => {
    const note = { id: 'c72b841b-1ac3-4a92-af97-6ff36447e9e0', title: 'A', content: 'B', tags: [], active: true, createdAt: new Date(), updatedAt: new Date() };

    const saving = data.put('notes', note);
    const put = http.expectOne(`${environment.apiUrl}/data/notes/${note.id}`);
    expect(put.request.method).toBe('PUT');
    put.flush(note);
    await saving;
    expect(data.notes).toEqual([note]);

    const removing = data.remove('notes', note.id);
    http.expectOne(`${environment.apiUrl}/data/notes/${note.id}`).flush(null);
    await removing;
    expect(data.notes).toEqual([]);
  });

  it('keeps local data unchanged when the API rejects a save', async () => {
    const note = { id: 'c72b841b-1ac3-4a92-af97-6ff36447e9e0', title: 'A', content: 'B', tags: [], active: true, createdAt: new Date(), updatedAt: new Date() };

    const saving = data.put('notes', note);
    http.expectOne(`${environment.apiUrl}/data/notes/${note.id}`).flush({ error: 'Storage limit reached' }, { status: 413, statusText: 'Payload Too Large' });

    await expectAsync(saving).toBeRejected();
    expect(data.notes).toEqual([]);
  });
});

describe('DataService while signed out', () => {
  let data: DataService;
  const user = new BehaviorSubject<User | null>(null);

  beforeEach(() => {
    localStorage.removeItem('notes');
    localStorage.removeItem('tags');
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { user, restore: () => Promise.resolve(), logout: () => Promise.resolve() } }],
    });
    data = TestBed.inject(DataService);
  });

  afterEach(() => {
    localStorage.removeItem('notes');
    localStorage.removeItem('tags');
  });

  it('stores notes in the browser and updates existing ones', async () => {
    const note = { id: 'c72b841b-1ac3-4a92-af97-6ff36447e9e0', title: 'A', content: 'B', tags: [], active: true, createdAt: new Date(), updatedAt: new Date() };

    await data.put('notes', note);
    await data.put('notes', { ...note, title: 'Edited' });

    expect(data.notes.map(item => item.title)).toEqual(['Edited']);
    expect(JSON.parse(localStorage.getItem('notes') ?? '[]').length).toBe(1);

    await data.remove('notes', note.id);
    expect(data.notes).toEqual([]);
  });

  it('ignores corrupted browser storage', () => {
    localStorage.setItem('notes', '{broken');

    expect(data.notes).toEqual([]);
  });

  it('notifies listeners after changes', async () => {
    const changed = jasmine.createSpy('changed');
    data.changed.subscribe(changed);
    changed.calls.reset();

    await data.put('tags', { id: '6a7c5a52-4e4c-4da0-9594-167372a03720', name: 'T', color: 0, active: true, createdAt: new Date(), updatedAt: new Date() });

    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('bootstraps without calling the API when signed out', async () => {
    await data.bootstrap();

    expect(data.notes).toEqual([]);
  });
});

