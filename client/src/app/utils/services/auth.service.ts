import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface User { id: string; email: string }
@Injectable({ providedIn: 'root' })
export class AuthService {
  user = new BehaviorSubject<User | null>(null);
  prompt = new BehaviorSubject<boolean>(false);
  pendingSave: (() => Promise<void>) | null = null;
  constructor(private http: HttpClient) {}
  async restore(): Promise<void> {
    try {
      const result = await firstValueFrom(this.http.get<{user: User}>(`${environment.apiUrl}/auth/me`, { withCredentials: true }));
      this.user.next(result.user);
    } catch { this.user.next(null); }
  }
  async signIn(mode: 'login' | 'register', email: string, password: string): Promise<void> {
    const result = await firstValueFrom(this.http.post<{user: User}>(`${environment.apiUrl}/auth/${mode}`, { email, password }, { withCredentials: true }));
    this.user.next(result.user);
  }
  async logout(): Promise<void> {
    try { await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })); }
    catch (error: any) { if (error?.status !== 401) throw error; }
    this.user.next(null);
  }
  requestSave(save: () => Promise<void>): void { this.pendingSave = save; this.prompt.next(true); }
  closePrompt(): void { this.prompt.next(false); this.pendingSave = null; }
}
