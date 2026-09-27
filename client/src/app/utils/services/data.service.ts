import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { INote } from '../interfaces/inote';
import { ITag } from '../interfaces/itag';
import { AuthService } from './auth.service';

interface Data { notes: INote[]; tags: ITag[] }
@Injectable({ providedIn: 'root' })
export class DataService {
  changed = new BehaviorSubject<void>(undefined);
  private cloud: Data = { notes: [], tags: [] };
  constructor(private http: HttpClient, private auth: AuthService) {}
  private local(): Data {
    try { return { notes: JSON.parse(localStorage.getItem('notes') || '[]'), tags: JSON.parse(localStorage.getItem('tags') || '[]') }; }
    catch { return { notes: [], tags: [] }; }
  }
  get notes(): INote[] { return this.auth.user.value ? this.cloud.notes : this.local().notes; }
  get tags(): ITag[] { return this.auth.user.value ? this.cloud.tags : this.local().tags; }
  async bootstrap(): Promise<void> {
    await this.auth.restore();
    if (this.auth.user.value) {
      try { await this.loadAndImport(); } catch { this.auth.user.next(null); }
    }
    this.changed.next();
  }
  async loadAndImport(): Promise<void> {
    const local = this.local();
    const path = local.notes.length || local.tags.length ? '/data/import' : '/data';
    this.cloud = path === '/data/import'
      ? await firstValueFrom(this.http.post<Data>(`${environment.apiUrl}${path}`, local, { withCredentials: true }))
      : await firstValueFrom(this.http.get<Data>(`${environment.apiUrl}${path}`, { withCredentials: true }));
    if (path === '/data/import') { localStorage.removeItem('notes'); localStorage.removeItem('tags'); }
    this.changed.next();
  }
  async logout(): Promise<void> { await this.auth.logout(); this.cloud = { notes: [], tags: [] }; this.changed.next(); }
  async put(kind: 'notes' | 'tags', item: INote | ITag): Promise<void> {
    if (this.auth.user.value) {
      await firstValueFrom(this.http.put(`${environment.apiUrl}/data/${kind}/${item.id}`, item, { withCredentials: true }));
      const items = this.cloud[kind] as (INote | ITag)[];
      const index = items.findIndex(x => x.id === item.id);
      if (index === -1) items.push(item); else items[index] = item;
    } else {
      const items = this.local()[kind] as (INote | ITag)[];
      const index = items.findIndex(x => x.id === item.id);
      if (index === -1) items.push(item); else items[index] = item;
      localStorage.setItem(kind, JSON.stringify(items));
    }
    this.changed.next();
  }
  async remove(kind: 'notes' | 'tags', id: string): Promise<void> {
    if (this.auth.user.value) {
      await firstValueFrom(this.http.delete(`${environment.apiUrl}/data/${kind}/${id}`, { withCredentials: true }));
      this.cloud[kind] = (this.cloud[kind] as (INote | ITag)[]).filter(x => x.id !== id) as any;
    } else {
      localStorage.setItem(kind, JSON.stringify((this.local()[kind] as (INote | ITag)[]).filter(x => x.id !== id)));
    }
    this.changed.next();
  }
}
