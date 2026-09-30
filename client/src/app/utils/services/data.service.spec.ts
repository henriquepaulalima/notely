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
});
