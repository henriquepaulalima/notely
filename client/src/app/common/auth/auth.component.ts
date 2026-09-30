import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from 'src/app/utils/services/auth.service';
import { DataService } from 'src/app/utils/services/data.service';
import { Subscription } from 'rxjs';

@Component({ selector: 'app-auth', templateUrl: './auth.component.html', styleUrls: ['./auth.component.scss'] })
export class AuthComponent implements OnInit, OnDestroy {
  mode: 'login' | 'register' = 'register';
  email = '';
  password = '';
  error = '';
  busy = false;
  warning = '';
  showPrompt = false;
  closingPrompt = false;
  private promptSubscription?: Subscription;
  private promptCloseTimer?: ReturnType<typeof setTimeout>;
  constructor(public auth: AuthService, private data: DataService) {}
  ngOnInit(): void {
    this.promptSubscription = this.auth.prompt.subscribe(open => {
      if (open) {
        if (this.promptCloseTimer) clearTimeout(this.promptCloseTimer);
        this.promptCloseTimer = undefined;
        this.closingPrompt = false;
        this.showPrompt = true;
      } else if (this.showPrompt && !this.closingPrompt) {
        this.closingPrompt = true;
        this.promptCloseTimer = setTimeout(() => {
          this.showPrompt = false;
          this.closingPrompt = false;
          this.promptCloseTimer = undefined;
        }, 250);
      }
    });
  }
  ngOnDestroy(): void {
    this.promptSubscription?.unsubscribe();
    if (this.promptCloseTimer) clearTimeout(this.promptCloseTimer);
  }
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
  dismiss(): void { if (!this.busy) this.auth.closePrompt(); }
}
