import { Component, ElementRef, ViewChild } from '@angular/core';
import { debounce } from 'rxjs';
import { INote } from 'src/app/utils/interfaces/inote';
import { NoteService } from 'src/app/utils/services/note.service';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.scss']
})
export class ManageComponent {

  @ViewChild('modalOverlayEl') modalOverlayEl!: ElementRef;
  @ViewChild('modalBlockEl') modalBlockEl!: ElementRef;

  public createTypeIsTag: boolean = false;
  public viewMode: ViewMode = ViewMode.LIST;
  public notes: INote[] = [];

  constructor(
    private noteService: NoteService
  ) {}

  public getTypeToggleValue(value: boolean): void {
    this.createTypeIsTag = value;
  }

  public getViewMode(viewModeValue: ViewMode): void {
    this.viewMode = viewModeValue;
  }

  public loadFilteredNotes(text: string): void {
    this.notes = this.noteService.getFilteredNotes(text);
  }
}

export enum ViewMode {
  LIST,
  GRID,
}
