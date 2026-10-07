import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { NotificationType } from '../utils/interfaces/inotification';
import { DataService } from '../utils/services/data.service';
import { NotificationService } from '../utils/services/notification.service';
import { TextareaAutoresizeDirective } from '../utils/directives/textarea-autoresize.directive';
import { HeaderComponent } from './header/header.component';
import { NotificationComponent } from './notification/notification.component';
import { TypeToggleComponent } from './type-toggle/type-toggle.component';

describe('HeaderComponent', () => {
  it('toggles the menu', () => {
    const header = new HeaderComponent();

    header.toggleMenu();
    expect(header.showMenu).toBeTrue();
    header.toggleMenu();
    expect(header.showMenu).toBeFalse();
  });
});

describe('NotificationComponent', () => {
  it('shows new notifications and removes them after five seconds', fakeAsync(() => {
    const service = new NotificationService();
    const component = new NotificationComponent(service);
    component.ngOnInit();

    service.createNewNotification({ id: 'n1', type: NotificationType.SUCCESS, message: 'Saved' });
    expect(component.notifications.map(item => item.message)).toEqual(['Saved']);

    tick(5000);
    tick(220);
    expect(component.notifications).toEqual([]);
  }));

  it('hides a notification only once', fakeAsync(() => {
    const element = document.createElement('div');
    element.id = 'n2';
    document.body.append(element);
    const component = new NotificationComponent(new NotificationService());
    const notification = { id: 'n2', type: NotificationType.ERROR, message: 'Failed' };
    component.notifications.push(notification);

    component.hide(notification);
    component.hide(notification);
    tick(220);

    expect(element.classList).toContain('hide');
    expect(component.notifications).toEqual([]);
    element.remove();
  }));
});

describe('TypeToggleComponent', () => {
  function create(type: string, page = 'create') {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    const route = { paramMap: new BehaviorSubject(convertToParamMap({ type })), url: new BehaviorSubject([{ path: page }]) } as unknown as ActivatedRoute;
    const data = { notes: [{}, {}], tags: [{}] } as unknown as DataService;
    const component = new TypeToggleComponent(router, route, data);
    component.ngOnInit();
    return { component, router };
  }

  it('reflects the route type and counts', () => {
    const { component } = create('tag');

    expect(component.typeIsTag.value).toBeTrue();
    expect(component.noteCount).toBe(2);
    expect(component.tagCount).toBe(1);
  });

  it('navigates to the other type on the same page', () => {
    const { component, router } = create('note', 'manage');

    component.typeIsTag.setValue(true);
    component.handleInputChange();

    expect(router.navigate).toHaveBeenCalledWith(['/manage/tag']);
  });
});

@Component({ template: '<textarea appTextareaAutoresize></textarea>' })
class AutoresizeHostComponent {}

describe('TextareaAutoresizeDirective', () => {
  it('grows the textarea to fit its content as the user types', fakeAsync(() => {
    TestBed.configureTestingModule({ declarations: [AutoresizeHostComponent, TextareaAutoresizeDirective] });
    const fixture = TestBed.createComponent(AutoresizeHostComponent);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    document.body.append(fixture.nativeElement);

    textarea.value = 'line\n'.repeat(20);
    textarea.dispatchEvent(new Event('input'));
    tick();

    expect(textarea.style.height).toBe(`${textarea.scrollHeight}px`);
    expect(textarea.scrollHeight).toBeGreaterThan(100);
  }));
});
