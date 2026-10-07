import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { AuthService, User } from 'src/app/utils/services/auth.service';
import { DataService } from 'src/app/utils/services/data.service';
import { AuthComponent } from './auth.component';

describe('AuthComponent', () => {
  let auth: AuthService;
  let data: jasmine.SpyObj<DataService>;
  let component: AuthComponent;
  const user: User = { id: 'user-id', email: 'user@notely.test' };

  beforeEach(() => {
    auth = Object.assign(Object.create(AuthService.prototype), {
      user: new BehaviorSubject<User | null>(null),
      prompt: new BehaviorSubject<boolean>(false),
      pendingSave: null,
      signIn: jasmine.createSpy('signIn').and.callFake(async () => auth.user.next(user)),
    });
    data = jasmine.createSpyObj<DataService>('DataService', ['loadAndImport', 'logout']);
    data.loadAndImport.and.resolveTo();
    data.logout.and.resolveTo();
    component = new AuthComponent(auth, data);
    component.ngOnInit();
    component.email = user.email;
    component.password = 'password1';
  });

  afterEach(() => component.ngOnDestroy());

  it('signs in, imports local data and runs the pending save', async () => {
    const save = jasmine.createSpy('save').and.resolveTo();
    auth.requestSave(save);
    component.mode = 'login';

    await component.submit();

    expect(auth.signIn).toHaveBeenCalledWith('login', user.email, 'password1');
    expect(data.loadAndImport).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
    expect(auth.prompt.value).toBeFalse();
    expect(component.password).toBe('');
    expect(component.busy).toBeFalse();
  });

  it("shows the server's error message", async () => {
    (auth.signIn as jasmine.Spy).and.rejectWith({ error: { error: 'Too many sign-in attempts for this account. Try again in 15 minutes.' } });

    await component.submit();

    expect(component.error).toBe('Too many sign-in attempts for this account. Try again in 15 minutes.');
    expect(component.busy).toBeFalse();
  });

  it('falls back to a generic message and signs out if the import fails', async () => {
    data.loadAndImport.and.rejectWith(new Error('offline'));

    await component.submit();

    expect(component.error).toBe('Could not connect to your account. Your local notes are still available.');
    expect(auth.user.value).toBeNull();
  });

  it('can continue without an account, warning that data stays on the device', async () => {
    const save = jasmine.createSpy('save').and.resolveTo();
    auth.requestSave(save);

    await component.continueLocal();

    expect(save).toHaveBeenCalled();
    expect(component.warning).toContain('Saved on this device only');
  });

  it('opens the prompt in login mode and closes it with an animation delay', fakeAsync(() => {
    component.openLogin();
    expect(component.mode).toBe('login');
    expect(component.showPrompt).toBeTrue();

    component.dismiss();
    expect(component.closingPrompt).toBeTrue();
    tick(250);
    expect(component.showPrompt).toBeFalse();
  }));

  it('cannot be dismissed while busy', () => {
    component.open();
    component.busy = true;

    component.dismiss();

    expect(auth.prompt.value).toBeTrue();
  });

  it('reports logout failures', async () => {
    data.logout.and.rejectWith(new Error('offline'));

    await component.logout();

    expect(component.error).toBe('Could not sign out. Please try again.');
  });
});
