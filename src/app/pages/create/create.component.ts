import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { INote } from 'src/app/utils/interfaces/inote';
import { NotificationType } from 'src/app/utils/interfaces/inotification';
import { ITag, ITagColor, TagColors } from 'src/app/utils/interfaces/itag';
import { NoteService } from 'src/app/utils/services/note.service';
import { NotificationService } from 'src/app/utils/services/notification.service';
import { TagService } from 'src/app/utils/services/tag.service';
import { v4 as uuidv4 } from 'uuid';

const body = document.querySelector('body');

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit {

  @ViewChild('modalOverlayEl') modalOverlayEl!: ElementRef;
  @ViewChild('modalBlockEl') modalBlockEl!: ElementRef;

  public createTypeIsTag: boolean = false;
  public noteForm!: FormGroup;
  public tagForm!: FormGroup;
  public tagColors!: ITagColor[];
  public tags: ITag[] = [];
  public noteTagsXref: string[] = [];
  public showColorPIckerModal: boolean = false;
  public screenTop: number = 0;

  constructor(
    private noteService: NoteService,
    private tagService: TagService,
    private notificationService: NotificationService,
    private renderer: Renderer2,
    private activatedRoute: ActivatedRoute
  ) {
    this.renderer.listen('window', 'click', (event: Event) => {
      if (event.target === this.modalOverlayEl?.nativeElement) {
        this.toggleColorPickerModal();
      }
    });

    this.activatedRoute.paramMap.subscribe((params: ParamMap) => {
      const type = params.get('type');

      if (type === 'note') {
        this.createTypeIsTag = false;
      } else if (type === 'tag') {
        this.createTypeIsTag = true;
      }
    });
  }

  ngOnInit(): void {

    this.noteForm = new FormGroup({
      title: new FormControl<string>('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
      ]),
      content: new FormControl<string>('', [
        Validators.required,
        Validators.minLength(3),
      ]),
    });

    this.tagForm = new FormGroup({
      name: new FormControl<string>('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
      ]),
      color: new FormControl<TagColors>(TagColors.PETERRIVER, [
        Validators.required,
      ]),
    });

    this.tagColors = this.tagService.getAllTagColors();
    this.tags = this.tagService.getAllTags();
  }

  get title(): AbstractControl<any, any> | null | undefined {
    return this.noteForm.get('title');
  }

  get content(): AbstractControl<any, any> | null | undefined {
    return this.noteForm.get('content');
  }

  get name(): AbstractControl<any, any> | null | undefined {
    return this.tagForm.get('name');
  }

  get color(): AbstractControl<any, any> | null | undefined {
    return this.tagForm.get('color');
  }

  public toggleTagToNote(tagId: string): void {
    if (this.noteTagsXref.includes(tagId)) {
      const tagIndex = this.noteTagsXref.indexOf(tagId);
      this.noteTagsXref.splice(tagIndex, 1);
    } else {
      this.noteTagsXref.push(tagId);
    }
  }

  public getTagColor(tagColor: TagColors): string {
    return this.tagService.getSingleTagColor(tagColor);
  }

  public submitNoteForm(): void {
    if (this.noteForm.invalid) throw new Error('Note\'s form is invalid');

    const newNoteData: INote = {
      id: uuidv4(),
      title: this.title?.value,
      content: this.content?.value,
      tags: this.noteTagsXref,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      this.noteService.createNote(newNoteData);
      this.clearForm(this.noteForm);

      this.notificationService.createNewNotification({ id: uuidv4(), type: NotificationType.SUCCESS, message: 'New note created' })
    } catch (error) {
      console.error(error);

      this.notificationService.createNewNotification({ id: uuidv4(), type: NotificationType.ERROR, message: 'Could not create new note' });
    }
  }

  public submitTagForm(): void {
    if (this.tagForm.invalid) throw new Error('Tag\'s form is invalid');

    const newTagData: ITag = {
      id: uuidv4(),
      name: this.name?.value,
      color: this.color?.value,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      this.tagService.createTag(newTagData);
      this.clearForm(this.tagForm);
      this.tags = this.tagService.getAllTags();

      this.notificationService.createNewNotification({ id: uuidv4(), type: NotificationType.SUCCESS, message: 'New tag created' });
    } catch (error) {
      console.error(error);

      this.notificationService.createNewNotification({ id: uuidv4(), type: NotificationType.ERROR, message: 'Could not create new tag' });
    }
  }

  public clearForm(form: FormGroup<any>): void {
    form.reset();

    if (form === this.noteForm) this.noteTagsXref = [];
    if (form === this.tagForm) this.color?.setValue(TagColors.PETERRIVER);
  }

  public toggleColorPickerModal(): void {
    this.screenTop = document.documentElement.scrollTop;
    if (this.showColorPIckerModal) {
      this.modalBlockEl.nativeElement.classList.add('close');
      setTimeout(() => {
        this.showColorPIckerModal = false;
        if (body) body.style.overflow = 'scroll';
      }, 500);
    } else {
      this.showColorPIckerModal = true;
      if (body) body.style.overflow = 'hidden';
    }
  }

  public pickColor(colorElement: ITagColor): void {
    const element = document.getElementById(colorElement.name);
    this.color?.setValue(colorElement.id);
    element?.focus();
    setTimeout(() => {
      this.toggleColorPickerModal();
    }, 250);
  }

  public createNoteTesst() {
    this.notificationService.createNewNotification({ id: uuidv4(), type: NotificationType.SUCCESS, message: `New tag created` });
  }
}
