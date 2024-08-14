import { Injectable } from '@angular/core';
import { INote } from '../interfaces/inote';

@Injectable({
  providedIn: 'root',
})
export class NoteService {
  constructor() {}

  public createNote(newNoteData: INote): void {
    let notes = this.getNotes();
    console.log(notes);

    if (!notes) {
      notes = [newNoteData];
    } else {
      notes.push(newNoteData);
    }

    localStorage.setItem('notes', JSON.stringify(notes));
  }

  public getNotes(): INote[] {
    const notes = JSON.parse(localStorage.getItem('notes')!);
    return notes;
  }
}
