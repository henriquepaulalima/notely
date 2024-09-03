import { Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { INote } from 'src/app/utils/interfaces/inote';
import { ITag, ITagColor, TagColors } from 'src/app/utils/interfaces/itag';
import { NoteService } from 'src/app/utils/services/note.service';

const body = document.querySelector('body');

@Component({
  selector: 'app-manage-modal',
  templateUrl: './manage-modal.component.html',
  styleUrls: ['./manage-modal.component.scss']
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

  constructor(
    private renderer: Renderer2,
    private noteService: NoteService
  ) {
    this.renderer.listen('window', 'click', (event: Event) => {
      if (event.target === this.modalOverlayEl?.nativeElement) {
        this.startHideModal();
      }
    })
  }

  ngOnInit(): void {
    if (body) body.style.overflow = 'hidden';

    if (this.typeIsTag) {
      this.tagData = this.data as ITag;
      this.tagForm = new FormGroup({
        name: new FormControl<string>(this.tagData.name, Validators.required),
        color: new FormControl<TagColors>(this.tagData.color, Validators.required),
        createdAt: new FormControl<Date>(this.tagData.createdAt, Validators.required),
        updatedAt: new FormControl<Date>(this.tagData.updatedAt, Validators.required)
      });
    } else {
      this.noteData = this.data as INote;
      this.noteForm = new FormGroup({
        title: new FormControl<string>(this.noteData.title, Validators.required),
        content: new FormControl<string>(this.noteData.content, Validators.required)
      });

      this.initialFormData = this.noteForm.value;

      this.noteForm.get('title')?.disable();
      this.noteForm.get('content')?.disable();
    }
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
      this.editingForm = false
      this.noteForm.get('title')?.disable();
      this.noteForm.get('content')?.disable();
      this.noteForm.setValue(this.initialFormData);
    } else {
      this.editingForm = true;
      this.noteForm.get('title')?.enable();
      this.noteForm.get('content')?.enable();
    }
  }

  public checkFormChange(form: FormGroup): void {
    if (form.value !== this.initialFormData) {
      this.formHasChanged = true;
    } else {
      this.formHasChanged = false;
    }
  }

  public saveNote() {
    const noteToEditData: INote = {
      id: this.noteData.id,
      title: this.noteForm.get('title')?.value,
      content: this.noteForm.get('content')?.value,
      tags: this.noteData.tags,
      createdAt: this.noteData.createdAt,
      updatedAt: new Date(),
      active: true
    };

    this.noteService.editNote(noteToEditData);

    this.reloadList.emit();
    this.startHideModal();
  }

  public deleteNote(): void {
    this.noteService.deleteNote(this.noteData.id);

    this.reloadList.emit();
    this.startHideModal();
  }
}
