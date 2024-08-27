import { Injectable } from '@angular/core';
import { INote } from '../interfaces/inote';
import { ITag } from '../interfaces/itag';

@Injectable({
  providedIn: 'root',
})
export class NoteService {

  constructor() {}

  public createNote(newNoteData: INote): void {
    let notes = this.getAllNotes();

    if (!notes) {
      notes = [newNoteData];
    } else {
      notes.push(newNoteData);
    }

    localStorage.setItem('notes', JSON.stringify(notes));
  }

  public getAllNotes(): INote[] {
    const notes = JSON.parse(localStorage.getItem('notes')!);
    return notes;
  }

  public getFilteredNotes(text?: string, tag?: ITag): INote[] {
    let notes = this.getAllNotes();
    const lowerText = text?.toLowerCase();

    if (lowerText) {
      notes = notes.filter(item => (item.title.toLowerCase().indexOf(lowerText) > -1) || (item.content.toLowerCase().indexOf(lowerText) > -1));
    }

    if (tag) {
      notes = notes.filter(item => item.tags.includes(tag));
    }

    return notes;
  }
}
