import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { INote } from 'src/app/utils/interfaces/inote';
import { ITag, TagColors } from 'src/app/utils/interfaces/itag';
import { GetTagColorService } from 'src/app/utils/services/get-tag-color.service';
import { NoteService } from 'src/app/utils/services/note.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit {
  public createTypeIsTag: FormControl<boolean | null> = new FormControl(false);
  public noteForm!: FormGroup;
  public tagsMock: ITag[] = [
    {
      id: uuidv4(),
      name: 'Tag 1',
      color: TagColors.DARK_RED,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Tag 2',
      color: TagColors.DARK_GREEN,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Tag 3',
      color: TagColors.DARK_BLUE,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  public noteTagsXref: ITag[] = [];

  constructor(
    private tagColorService: GetTagColorService,
    private noteService: NoteService
  ) {}

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
  }

  get title(): AbstractControl<any, any> | null | undefined {
    return this.noteForm.get('title');
  }

  get content(): AbstractControl<any, any> | null | undefined {
    return this.noteForm.get('content');
  }

  public toggleTagToNote(tagId: string): void {
    const tag = this.tagsMock.find((item) => item.id == tagId);

    if (tag) {
      if (this.noteTagsXref.includes(tag)) {
        const tagIndex = this.noteTagsXref.indexOf(tag);
        this.noteTagsXref.splice(tagIndex, 1);
      } else {
        this.noteTagsXref.push(tag);
      }
    } else {
      throw new Error("Can't find tag in tag list");
    }
  }

  public getTagColor(tagColor: TagColors): string {
    return this.tagColorService.get(tagColor);
  }

  public submitNoteForm(): void {
    if (this.noteForm.invalid) throw new Error("Note's form is invalid");

    const newNoteData: INote = {
      id: uuidv4(),
      title: this.noteForm.value.title,
      content: this.noteForm.value.content,
      tags: this.noteTagsXref,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      this.noteService.createNote(newNoteData);
      this.clearForm();
    } catch (error) {
      console.error(error);
    }
  }

  public clearForm(): void {
    this.noteForm.reset();
    this.noteTagsXref = [];
  }
}
