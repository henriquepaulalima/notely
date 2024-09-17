import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
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
export class ManageModalComponent implements OnInit {
  @Input() typeIsTag: boolean = false;
  @Input() data!: INote | ITag;
  @Input() screenTop: number = 0;
  @Output() hideModal: EventEmitter<void> = new EventEmitter<void>();
  @Output() reloadList: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('modalOverlayEl') modalOverlayEl!: ElementRef;
  @ViewChild('modalBlockEl') modalBlockEl!: ElementRef;

  public noteData!: INote;
  public tagData!: ITag;
  public showModal: boolean = true;
  public noteForm!: FormGroup;
  public tagForm!: FormGroup;
  public editingForm: boolean = false;
  public formHasChanged: boolean = false;
  public initialFormData!: Object;
  public tagColors: ITagColor[] = [];
  public editingTagColor: boolean = false;

  constructor(
    private renderer: Renderer2,
    private noteService: NoteService,
    private tagService: TagService,
    private notificationService: NotificationService,
  ) {
    this.renderer.listen('window', 'click', (event: Event) => {
      if (event.target === this.modalOverlayEl?.nativeElement) {
        this.startHideModal();
      }
    });
  }

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
      this.noteForm = new FormGroup({
        title: new FormControl<string>(
          this.noteData.title,
          Validators.required,
        ),
        content: new FormControl<string>(
          this.noteData.content,
          Validators.required,
        ),
      });

      this.initialFormData = this.noteForm.value;

      this.noteForm.get('title')?.disable();
      this.noteForm.get('content')?.disable();
    }
  }

  get tagColor(): AbstractControl<any, any> | null | undefined {
    return this.tagForm.get('color');
  }

  public startHideModal(): void {
    this.modalBlockEl.nativeElement.classList.add('close');
    setTimeout(() => {
      this.showModal = false;
      if (body) body.style.overflow = 'scroll';
      this.hideModal.emit();
    }, 500);
  }

  public toggleEditForm(): void {
    if (this.editingForm) {
      this.editingForm = false;
      if (this.typeIsTag) {
        this.tagForm.get('name')?.disable();
        this.tagForm.get('color')?.disable();
        this.tagForm.setValue(this.initialFormData);
      } else {
        this.noteForm.get('title')?.disable();
        this.noteForm.get('content')?.disable();
        this.noteForm.setValue(this.initialFormData);
      }
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
    if (form.value !== this.initialFormData) {
      this.formHasChanged = true;
    } else {
      this.formHasChanged = false;
    }
  }

  public save(): void {
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
        this.tagService.editTag(tagToEditData);
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
          message: 'Could not edit tag',
        });
      }
    } else {
      const noteToEditData: INote = {
        id: this.noteData.id,
        title: this.noteForm.get('title')?.value,
        content: this.noteForm.get('content')?.value,
        tags: this.noteData.tags,
        createdAt: this.noteData.createdAt,
        updatedAt: new Date(),
        active: true,
      };

      try {
        this.noteService.editNote(noteToEditData);
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
          message: 'Could not edit note',
        });
      }
    }
  }

  public delete(): void {
    if (this.typeIsTag) {
      try {
        this.tagService.deleteTag(this.tagData.id);
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
        this.noteService.deleteNote(this.noteData.id);
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
}
