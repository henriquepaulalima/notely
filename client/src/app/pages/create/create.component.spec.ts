import { Renderer2 } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { NotificationType } from 'src/app/utils/interfaces/inotification';
import { TagColors } from 'src/app/utils/interfaces/itag';
import { AuthService, User } from 'src/app/utils/services/auth.service';
import { DataService } from 'src/app/utils/services/data.service';
import { NoteService } from 'src/app/utils/services/note.service';
import { NotificationService } from 'src/app/utils/services/notification.service';
import { TagService } from 'src/app/utils/services/tag.service';
import { makeTag } from 'src/app/utils/testing';
import { CreateComponent } from './create.component';

describe('CreateComponent', () => {
  let noteService: jasmine.SpyObj<NoteService>;
  let tagService: TagService;
  let notifications: jasmine.SpyObj<NotificationService>;
  let auth: { user: BehaviorSubject<User | null>; requestSave: jasmine.Spy };
  let component: CreateComponent;
  const work = makeTag({ name: 'Work' });

  function create(type = 'note') {
    noteService = jasmine.createSpyObj<NoteService>('NoteService', ['createNote']);
    noteService.createNote.and.resolveTo();
    const data = { changed: new BehaviorSubject<void>(undefined), tags: [work], put: jasmine.createSpy('put').and.resolveTo() } as unknown as DataService;
    tagService = new TagService(data);
    spyOn(tagService, 'createTag').and.resolveTo();
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['createNewNotification']);
    auth = { user: new BehaviorSubject<User | null>({ id: 'u', email: 'u@notely.test' }), requestSave: jasmine.createSpy('requestSave') };
    const renderer = { listen: () => () => {} } as unknown as Renderer2;
    const route = { paramMap: new BehaviorSubject(convertToParamMap({ type })) } as unknown as ActivatedRoute;
    component = new CreateComponent(noteService, auth as unknown as AuthService, data, tagService, notifications, renderer, route);
    component.ngOnInit();
  }
  const lastNotification = () => notifications.createNewNotification.calls.mostRecent().args[0];

  it('follows the route between note and tag forms', () => {
    create('tag');
    expect(component.createTypeIsTag).toBeTrue();
    create('note');
    expect(component.createTypeIsTag).toBeFalse();
    expect(component.tags).toEqual([work]);
  });

  it('validates the note form, including the 20,000 character content limit', () => {
    create();
    component.noteForm.setValue({ title: 'ab', content: 'ok' });
    expect(component.title?.hasError('minlength')).toBeTrue();
    expect(component.content?.hasError('minlength')).toBeTrue();

    component.noteForm.setValue({ title: 'x'.repeat(21), content: 'x'.repeat(20001) });
    expect(component.title?.hasError('maxlength')).toBeTrue();
    expect(component.content?.hasError('maxlength')).toBeTrue();

    component.noteForm.setValue({ title: 'Valid', content: 'x'.repeat(20000) });
    expect(component.noteForm.valid).toBeTrue();
  });

  it('saves a note with its selected tags and resets the form', async () => {
    create();
    component.noteForm.setValue({ title: 'Plan', content: 'Write tests' });
    component.toggleTagToNote(work.id);

    component.submitNoteForm();
    await noteService.createNote.calls.mostRecent().returnValue;
    await Promise.resolve();

    expect(noteService.createNote).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Plan', content: 'Write tests', tags: [work.id] }));
    expect(component.noteForm.value).toEqual({ title: null, content: null });
    expect(component.noteTagsXref).toEqual([]);
    expect(lastNotification()).toEqual(jasmine.objectContaining({ type: NotificationType.SUCCESS, message: 'New note created' }));
  });

  it('toggles tags on and off the new note', () => {
    create();

    component.toggleTagToNote(work.id);
    component.toggleTagToNote(work.id);

    expect(component.noteTagsXref).toEqual([]);
  });

  it("shows the server's message when saving fails", async () => {
    create();
    noteService.createNote.and.rejectWith({ error: { error: 'Storage limit reached: up to 500 notes' } });
    component.noteForm.setValue({ title: 'Plan', content: 'Write tests' });

    component.submitNoteForm();
    await new Promise(resolve => setTimeout(resolve));

    expect(lastNotification()).toEqual(jasmine.objectContaining({ type: NotificationType.ERROR, message: 'Storage limit reached: up to 500 notes' }));
  });

  it('asks guests to sign in or save locally before saving', () => {
    create();
    auth.user.next(null);
    component.noteForm.setValue({ title: 'Plan', content: 'Write tests' });

    component.submitNoteForm();

    expect(auth.requestSave).toHaveBeenCalled();
    expect(noteService.createNote).not.toHaveBeenCalled();
  });

  it('refuses to submit an invalid form', () => {
    create();

    expect(() => component.submitNoteForm()).toThrowError("Note's form is invalid");
    expect(() => component.submitTagForm()).toThrowError("Tag's form is invalid");
  });

  it('saves a tag with the picked color', async () => {
    create('tag');
    component.tagForm.get('name')?.setValue('Errands');
    component.pickColor({ id: TagColors.AMBER, name: 'AMBER', color: '#a2601a' });

    component.submitTagForm();
    await new Promise(resolve => setTimeout(resolve));

    expect(tagService.createTag).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Errands', color: TagColors.AMBER }));
    expect(component.color?.value).toBe(TagColors.PETERRIVER);
    expect(lastNotification().message).toBe('New tag created');
  });
});
