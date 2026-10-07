import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let http: HttpTestingController;
  let auth: AuthService;
  const user = { id: 'user-id', email: 'user@notely.test' };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => http.verify());

  it('restores the signed-in user with the session cookie', async () => {
    const restoring = auth.restore();
    const request = http.expectOne(`${environment.apiUrl}/auth/me`);
    expect(request.request.withCredentials).toBeTrue();
    request.flush({ user });
    await restoring;

    expect(auth.user.value).toEqual(user);
  });

  it('treats a failed restore as signed out', async () => {
    auth.user.next(user);
    const restoring = auth.restore();
    http.expectOne(`${environment.apiUrl}/auth/me`).flush({ error: 'Session expired' }, { status: 401, statusText: 'Unauthorized' });
    await restoring;

    expect(auth.user.value).toBeNull();
  });

  it('signs in or registers with email and password', async () => {
    for (const mode of ['login', 'register'] as const) {
      const signingIn = auth.signIn(mode, user.email, 'password1');
      const request = http.expectOne(`${environment.apiUrl}/auth/${mode}`);
      expect(request.request.body).toEqual({ email: user.email, password: 'password1' });
      expect(request.request.withCredentials).toBeTrue();
      request.flush({ user });
      await signingIn;
    }

    expect(auth.user.value).toEqual(user);
  });

  it('surfaces sign-in errors', async () => {
    const signingIn = auth.signIn('login', user.email, 'wrong');
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({ error: 'Invalid email or password' }, { status: 401, statusText: 'Unauthorized' });

    await expectAsync(signingIn).toBeRejected();
    expect(auth.user.value).toBeNull();
  });

  it('logs out, treating an already expired session as logged out', async () => {
    auth.user.next(user);
    const loggingOut = auth.logout();
    http.expectOne(`${environment.apiUrl}/auth/logout`).flush(null, { status: 401, statusText: 'Unauthorized' });
    await loggingOut;

    expect(auth.user.value).toBeNull();
  });

  it('keeps the user signed in when logout fails for another reason', async () => {
    auth.user.next(user);
    const loggingOut = auth.logout();
    http.expectOne(`${environment.apiUrl}/auth/logout`).flush(null, { status: 500, statusText: 'Server Error' });

    await expectAsync(loggingOut).toBeRejected();
    expect(auth.user.value).toEqual(user);
  });

  it('opens the sign-in prompt with a pending save and clears it on close', () => {
    const save = () => Promise.resolve();

    auth.requestSave(save);
    expect(auth.prompt.value).toBeTrue();
    expect(auth.pendingSave).toBe(save);

    auth.closePrompt();
    expect(auth.prompt.value).toBeFalse();
    expect(auth.pendingSave).toBeNull();
  });
});
