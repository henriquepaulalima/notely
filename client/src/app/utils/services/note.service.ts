import { Injectable } from '@angular/core';
import { INote } from '../interfaces/inote';
import { ITag } from '../interfaces/itag';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class NoteService {
  constructor(private data: DataService) {}

  public createNote(note: INote): Promise<void> { return this.data.put('notes', note); }
  public getAllNotes(): INote[] { return this.data.notes; }

  public getFilteredNotes(text?: string | null, tag?: ITag | null): INote[] {
    let filteredNotes = this.getAllNotes();
    const lowerText = text?.toLowerCase();

    if (lowerText) {
      filteredNotes = filteredNotes.filter(
        (item) =>
          item.title.toLowerCase().indexOf(lowerText) > -1 ||
          item.content.toLowerCase().indexOf(lowerText) > -1,
      );
    }

    if (tag) {
      filteredNotes = filteredNotes.filter((item) =>
        item.tags.some((itemTag) => itemTag == tag.id),
      );
    }

    if (!lowerText && !tag) {
      filteredNotes = this.getAllNotes();
    }

    return filteredNotes;
  }

  public editNote(note: INote): Promise<void> { return this.data.put('notes', note); }
  public deleteNote(id: string): Promise<void> { return this.data.remove('notes', id); }

  public isUUIDValid(uuid: string): boolean {
    const valididRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return valididRegex.test(uuid);
  }
}
