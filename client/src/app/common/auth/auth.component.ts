import { Component } from '@angular/core';
import { AuthService } from 'src/app/utils/services/auth.service';
import { DataService } from 'src/app/utils/services/data.service';

@Component({ selector: 'app-auth', templateUrl: './auth.component.html', styleUrls: ['./auth.component.scss'] })
export class AuthComponent {
  mode: 'login' | 'register' = 'register';
  email = '';
  password = '';
  error = '';
  busy = false;
  warning = '';
  constructor(public auth: AuthService, private data: DataService) {}
  async submit(): Promise<void> {
    this.busy = true;
    this.error = '';
    let signedIn = false;
    try {
      await this.auth.signIn(this.mode, this.email, this.password);
      signedIn = true;
      await this.data.loadAndImport();
      const save = this.auth.pendingSave;
      this.auth.closePrompt();
      if (save) await save();
      this.password = '';
      this.warning = '';
    } catch (error: any) {
      if (signedIn) this.auth.user.next(null);
      this.error = error?.error?.error || 'Could not connect to your account. Your local notes are still available.';
    } finally { this.busy = false; }
  }
  async continueLocal(): Promise<void> {
    const save = this.auth.pendingSave;
    this.auth.closePrompt();
    if (save) await save();
    this.warning = 'Saved on this device only. Browser data can be cleared or lost.';
  }
  async logout(): Promise<void> {
    try { await this.data.logout(); } catch { this.error = 'Could not sign out. Please try again.'; }
  }
  open(): void { this.error = ''; this.auth.prompt.next(true); }
  openLogin(): void { this.mode = 'login'; this.open(); }
}
