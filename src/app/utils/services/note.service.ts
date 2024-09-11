import { Injectable } from '@angular/core';
import { INote } from '../interfaces/inote';
import { ITag } from '../interfaces/itag';

@Injectable({
  providedIn: 'root',
})
export class NoteService {

  constructor() {}

  public saveNewNotesArray(notesArray: INote[]): void {
    localStorage.setItem('notes', JSON.stringify(notesArray));
  }

  public createNote(newNoteData: INote): void {
    let notes = this.getAllNotes();

    if (!notes) {
      notes = [newNoteData];
    } else {
      notes.push(newNoteData);
    }

    this.saveNewNotesArray(notes);
  }

  public getAllNotes(): INote[] {
    let notes = JSON.parse(localStorage.getItem('notes')!);
    if (!notes) notes = [];
    return notes;
  }

  public getFilteredNotes(text?: string | null, tag?: ITag | null): INote[] {
    let filteredNotes = this.getAllNotes();
    const lowerText = text?.toLowerCase();

    if (lowerText) {
      filteredNotes = filteredNotes.filter(item => (item.title.toLowerCase().indexOf(lowerText) > -1) || (item.content.toLowerCase().indexOf(lowerText) > -1));
    }

    if (tag) {
      filteredNotes = filteredNotes.filter(item => item.tags.some(itemTag => itemTag.id == tag.id));
    }

    if (!lowerText && !tag) {
      filteredNotes = this.getAllNotes();
    }

    return filteredNotes;
  }

  public editNote(note: INote): void {
    const notes = this.getAllNotes();

    const noteToEdit = notes.find(x => x.id === note.id)

    if (noteToEdit) {
      const noteToEditIndex = notes.indexOf(noteToEdit)
      notes[noteToEditIndex] = note;
      this.saveNewNotesArray(notes);
    };
  }

  public deleteNote(noteId: string): void {
    if (!this.isUUIDValid(noteId)) {
      throw new Error('Note iD is not valid');
    } else {
      const notes = this.getAllNotes();
      const noteToDelete = notes.find(note => note.id === noteId);

      if (noteToDelete) {
        const noteToDeleteIndex = notes.indexOf(noteToDelete);
        notes.splice(noteToDeleteIndex, 1);

        this.saveNewNotesArray(notes);
      }
    }
  }

  public isUUIDValid(uuid: string): boolean {
    const valididRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return (valididRegex.test(uuid));
  }
}
