import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { INote } from 'src/app/utils/interfaces/inote';
import { ITag, TagColors } from 'src/app/utils/interfaces/itag';
import { NoteService } from 'src/app/utils/services/note.service';
import { TagService } from 'src/app/utils/services/tag.service';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.scss']
})
export class ManageComponent implements OnInit {

  @ViewChild('modalOverlayEl') modalOverlayEl!: ElementRef;
  @ViewChild('modalBlockEl') modalBlockEl!: ElementRef;

  public createTypeIsTag: boolean = false;
  public viewMode: ViewMode = ViewMode.LIST;
  public notes: INote[] = [];

  constructor(
    private noteService: NoteService,
    private tagService: TagService
  ) {}

  ngOnInit(): void {
    this.notes = this.noteService.getAllNotes();
    console.log(this.notes);
  }

  public getTypeToggleValue(value: boolean): void {
    this.createTypeIsTag = value;
  }

  public getViewMode(viewModeValue: ViewMode): void {
    this.viewMode = viewModeValue;
  }

  public loadFilteredNotes(text: string): void {
    this.notes = this.noteService.getFilteredNotes(text);
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  public getTagColor(tagColor: TagColors): string {
    return this.tagService.getSingleTagColor(tagColor);
  }
}

export enum ViewMode {
  LIST,
  GRID,
}
