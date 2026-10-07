import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { INote } from 'src/app/utils/interfaces/inote';
import { NotificationType } from 'src/app/utils/interfaces/inotification';
import { ITag, ITagColor, TagColors } from 'src/app/utils/interfaces/itag';
import { NoteService } from 'src/app/utils/services/note.service';
import { NotificationService } from 'src/app/utils/services/notification.service';
import { TagService } from 'src/app/utils/services/tag.service';
import { v4 as uuidv4 } from 'uuid';

const body = document.querySelector('body');

@Component({
  selector: 'app-manage-modal',
  templateUrl: './manage-modal.component.html',
  styleUrls: ['./manage-modal.component.scss'],
})
export class ManageModalComponent implements OnInit, OnDestroy {
  @Input() typeIsTag: boolean = false;
  @Input() data!: INote | ITag;
  @Input() screenTop: number = 0;
  @Output() hideModal: EventEmitter<void> = new EventEmitter<void>();
  @Output() reloadList: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('modalOverlayEl') modalOverlayEl!: ElementRef;
  @ViewChild('modalBlockEl') modalBlockEl!: ElementRef;
  @ViewChild('colorControlEl') colorControlEl?: ElementRef;
  @ViewChild('colorButtonEl') colorButtonEl?: ElementRef;

  public noteData!: INote;
  public tagData!: ITag;
  public showModal: boolean = true;
  public isClosing: boolean = false;
  public noteForm!: FormGroup;
  public tagForm!: FormGroup;
  public editingForm: boolean = false;
  public formHasChanged: boolean = false;
  public initialFormData!: Object;
  public tagColors: ITagColor[] = [];
  public availableTags: ITag[] = [];
  public noteTags: string[] = [];
  public editingTagColor: boolean = false;
  public colorMenuPosition = { top: 0, left: 0 };
  private unlistenWindow: () => void;

  constructor(
    private renderer: Renderer2,
    private noteService: NoteService,
    private tagService: TagService,
    private notificationService: NotificationService,
  ) {
    this.unlistenWindow = this.renderer.listen('window', 'click', (event: Event) => {
      if (event.target === this.modalOverlayEl?.nativeElement) {
        this.startHideModal();
      } else if (this.editingTagColor &&
        !this.colorControlEl?.nativeElement.contains(event.target)) {
        this.editingTagColor = false;
      }
    });
  }

  ngOnDestroy(): void { this.unlistenWindow(); }

  ngOnInit(): void {
    if (body) body.style.overflow = 'hidden';

    if (this.typeIsTag) {
      this.tagData = this.data as ITag;
      this.tagForm = new FormGroup({
        name: new FormControl<string>(this.tagData.name, Validators.required),
        color: new FormControl<TagColors>(
          this.tagData.color,
          Validators.required,
        ),
      });

      this.initialFormData = this.tagForm.value;

      this.tagForm.get('name')?.disable();
      this.tagForm.get('color')?.disable();

      this.tagColors = this.tagService.getAllTagColors();
    } else {
      this.noteData = this.data as INote;
      this.availableTags = this.tagService.getAllTags();
      this.noteTags = [...this.noteData.tags];
      this.noteForm = new FormGroup({
        title: new FormControl<string>(
          this.noteData.title,
          Validators.required,
        ),
        content: new FormControl<string>(this.noteData.content, [
          Validators.required,
          Validators.maxLength(20000),
        ]),
      });

      this.initialFormData = this.noteForm.value;

      this.noteForm.get('title')?.disable();
      this.noteForm.get('content')?.disable();
    }
  }

  get tagColor(): AbstractControl<any, any> | null | undefined {
    return this.tagForm.get('color');
  }

  get selectedTags(): ITag[] {
    return this.availableTags.filter(tag => this.noteTags.includes(tag.id));
  }

  public startHideModal(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    setTimeout(() => {
      this.showModal = false;
      if (body) body.style.overflow = 'scroll';
      this.hideModal.emit();
    }, 250);
  }

  public toggleEditForm(): void {
    if (this.editingForm) {
      this.editingForm = false;
      this.editingTagColor = false;
      if (this.typeIsTag) {
        this.tagForm.get('name')?.disable();
        this.tagForm.get('color')?.disable();
        this.tagForm.setValue(this.initialFormData);
      } else {
        this.noteForm.get('title')?.disable();
        this.noteForm.get('content')?.disable();
        this.noteForm.setValue(this.initialFormData);
        this.noteTags = [...this.noteData.tags];
      }
      this.formHasChanged = false;
    } else {
      if (this.typeIsTag) {
        this.editingForm = true;
        this.tagForm.get('name')?.enable();
        this.tagForm.get('color')?.enable();
      } else {
        this.editingForm = true;
        this.noteForm.get('title')?.enable();
        this.noteForm.get('content')?.enable();
      }
    }
  }

  public checkFormChange(form: FormGroup): void {
    this.formHasChanged = this.typeIsTag
      ? form.get('name')?.value !== this.tagData.name || form.get('color')?.value !== this.tagData.color
      : form.get('title')?.value !== this.noteData.title ||
        form.get('content')?.value !== this.noteData.content ||
        this.noteTags.length !== this.noteData.tags.length ||
        this.noteTags.some(id => !this.noteData.tags.includes(id));
  }

  public toggleNoteTag(id: string): void {
    if (!this.editingForm) return;
    this.noteTags = this.noteTags.includes(id)
      ? this.noteTags.filter(tagId => tagId !== id)
      : [...this.noteTags, id];
    this.checkFormChange(this.noteForm);
  }

  public async save(): Promise<void> {
    if (this.typeIsTag) {
      const tagToEditData: ITag = {
        id: this.tagData.id,
        name: this.tagForm.get('name')?.value,
        color: this.tagColor?.value,
        createdAt: this.tagData.createdAt,
        updatedAt: new Date(),
        active: true,
      };

      try {
        await this.tagService.editTag(tagToEditData);
        this.reloadList.emit();
        this.startHideModal();

        this.notificationService.createNewNotification({
          id: uuidv4(),
          type: NotificationType.SUCCESS,
          message: 'Tag edited',
        });
      } catch (error) {
        console.error(error);

        this.notificationService.createNewNotification({
          id: uuidv4(),
          type: NotificationType.ERROR,
          message: (error as any)?.error?.error || 'Could not edit tag',
        });
      }
    } else {
      const noteToEditData: INote = {
        id: this.noteData.id,
        title: this.noteForm.get('title')?.value,
        content: this.noteForm.get('content')?.value,
        tags: [...this.noteTags],
        createdAt: this.noteData.createdAt,
        updatedAt: new Date(),
        active: true,
      };

      try {
        await this.noteService.editNote(noteToEditData);
        this.reloadList.emit();
        this.startHideModal();

        this.notificationService.createNewNotification({
          id: uuidv4(),
          type: NotificationType.SUCCESS,
          message: 'Note edited',
        });
      } catch (error) {
        console.error(error);

        this.notificationService.createNewNotification({
          id: uuidv4(),
          type: NotificationType.ERROR,
          message: (error as any)?.error?.error || 'Could not edit note',
        });
      }
    }
  }

  public async delete(): Promise<void> {
    if (this.typeIsTag) {
      try {
        await this.tagService.deleteTag(this.tagData.id);
        this.reloadList.emit();
        this.startHideModal();

        this.notificationService.createNewNotification({
          id: uuidv4(),
          type: NotificationType.SUCCESS,
          message: 'Tag deleted',
        });
      } catch (error) {
        console.error(error);

        this.notificationService.createNewNotification({
          id: uuidv4(),
          type: NotificationType.ERROR,
          message: 'Could not delete tag',
        });
      }
    } else {
      try {
        await this.noteService.deleteNote(this.noteData.id);
        this.reloadList.emit();
        this.startHideModal();

        this.notificationService.createNewNotification({
          id: uuidv4(),
          type: NotificationType.SUCCESS,
          message: 'Note deleted',
        });
      } catch (error) {
        console.error(error);

        this.notificationService.createNewNotification({
          id: uuidv4(),
          type: NotificationType.ERROR,
          message: 'Could not delete note',
        });
      }
    }
  }

  public getTagColor(tagColor: TagColors | null | undefined): string {
    if (tagColor != null) {
      return this.tagService.getSingleTagColor(tagColor);
    } else {
      throw new Error('Attribute: tagColor is null');
    }
  }

  public pickColor(colorElement: TagColors): void {
    this.tagColor?.setValue(colorElement);
    this.editingTagColor = false;
    this.checkFormChange(this.tagForm);
  }

  public toggleColorPicker(): void {
    if (!this.editingForm) return;
    if (!this.editingTagColor) {
      const rect = this.colorButtonEl?.nativeElement.getBoundingClientRect();
      if (rect) {
        const menuWidth = 172;
        const menuHeight = 164;
        this.colorMenuPosition = {
          left: Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8)),
          top: rect.bottom + menuHeight + 8 <= window.innerHeight
            ? rect.bottom + 8
            : Math.max(8, rect.top - menuHeight - 8),
        };
      }
    }
    this.editingTagColor = !this.editingTagColor;
  }
}
