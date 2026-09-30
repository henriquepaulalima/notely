import { Renderer2 } from '@angular/core';
import { INote } from 'src/app/utils/interfaces/inote';
import { ITag, TagColors } from 'src/app/utils/interfaces/itag';
import { NoteService } from 'src/app/utils/services/note.service';
import { NotificationService } from 'src/app/utils/services/notification.service';
import { TagService } from 'src/app/utils/services/tag.service';
import { ManageModalComponent } from './manage-modal.component';

describe('ManageModalComponent note tags', () => {
  const originalTag: ITag = {
    id: 'b3f040b0-2fc9-48b4-9cc7-cd6e23e37438', name: 'Ideas', color: TagColors.PETERRIVER,
    active: true, createdAt: new Date(), updatedAt: new Date(),
  };
  const newTag: ITag = {
    ...originalTag, id: 'ec65708a-99d9-4602-ab77-04c77450331c', name: 'Work',
  };
  const note: INote = {
    id: 'de4772af-fda5-45c5-9581-14239d42fe22', title: 'A note', content: 'Content',
    tags: [originalTag.id], active: true, createdAt: new Date(), updatedAt: new Date(),
  };

  function create(): { component: ManageModalComponent; editNote: jasmine.Spy } {
    const renderer = { listen: () => () => {} } as unknown as Renderer2;
    const editNote = jasmine.createSpy('editNote').and.returnValue(Promise.resolve());
    const noteService = { editNote } as unknown as NoteService;
    const tagService = { getAllTags: () => [originalTag, newTag] } as unknown as TagService;
    const notifications = { createNewNotification: () => {} } as unknown as NotificationService;
    const component = new ManageModalComponent(renderer, noteService, tagService, notifications);
    component.data = note;
    component.ngOnInit();
    component.modalBlockEl = { nativeElement: { classList: { add: () => {} } } } as any;
    return { component, editNote };
  }

  it('adds a tag to an existing note and saves it', async () => {
    const { component, editNote } = create();
    component.toggleEditForm();
    component.toggleNoteTag(newTag.id);
    expect(component.formHasChanged).toBeTrue();

    await component.save();
    expect(editNote).toHaveBeenCalledWith(jasmine.objectContaining({
      tags: [originalTag.id, newTag.id],
    }));
  });

  it('restores tags when editing is cancelled', () => {
    const { component } = create();
    component.toggleEditForm();
    component.toggleNoteTag(newTag.id);
    component.toggleEditForm();

    expect(component.noteTags).toEqual([originalTag.id]);
    expect(component.formHasChanged).toBeFalse();
  });
});
