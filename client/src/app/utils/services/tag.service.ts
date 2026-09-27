import { Injectable } from '@angular/core';
import { ITag, ITagColor, TagColors } from '../interfaces/itag';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class TagService {
  constructor(private data: DataService) {}
  public createTag(tag: ITag): Promise<void> { return this.data.put('tags', tag); }
  public getAllTags(): ITag[] { return this.data.tags; }

  public getFilteredTags(text: string | null): ITag[] {
    let filteredNotes = this.getAllTags();
    const lowerTest = text?.toLowerCase();

    if (lowerTest) {
      filteredNotes = filteredNotes.filter(
        (item) => item.name.toLowerCase().indexOf(lowerTest) > -1,
      );
    }

    return filteredNotes;
  }

  public editTag(tag: ITag): Promise<void> { return this.data.put('tags', tag); }
  public deleteTag(id: string): Promise<void> { return this.data.remove('tags', id); }

  public isUUIDValid(uuid: string): boolean {
    const valididRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return valididRegex.test(uuid);
  }

  public getSingleTagColor(tagColor: TagColors): string {
    switch (tagColor) {
      case TagColors.PETERRIVER:
        return '#315cbe';
      case TagColors.EMERALD:
        return '#257654';
      case TagColors.TURQUOISE:
        return '#177e83';
      case TagColors.AMBER:
        return '#a2601a';
      case TagColors.CARROT:
        return '#b6532f';
      case TagColors.ALIZARIN:
        return '#b34350';
      case TagColors.AMETHYST:
        return '#704bb2';
      case TagColors.CONCRETE:
        return '#5c6875';
      case TagColors.WETASPHALT:
        return '#344b5c';
      default:
        throw new Error('Cannot return color code without color identifier');
    }
  }

  public getAllTagColors(): ITagColor[] {
    return [
      {
        id: TagColors.PETERRIVER,
        name: 'PETERRIVER',
        color: '#315cbe',
      },
      {
        id: TagColors.EMERALD,
        name: 'EMERALD',
        color: '#257654',
      },
      {
        id: TagColors.TURQUOISE,
        name: 'TURQUOISE',
        color: '#177e83',
      },
      {
        id: TagColors.AMBER,
        name: 'AMBER',
        color: '#a2601a',
      },
      {
        id: TagColors.CARROT,
        name: 'CARROT',
        color: '#b6532f',
      },
      {
        id: TagColors.ALIZARIN,
        name: 'ALIZARIN',
        color: '#b34350',
      },
      {
        id: TagColors.AMETHYST,
        name: 'AMETHYST',
        color: '#704bb2',
      },
      {
        id: TagColors.CONCRETE,
        name: 'CONCRETE',
        color: '#5c6875',
      },
      {
        id: TagColors.WETASPHALT,
        name: 'WETASPHALT',
        color: '#344b5c',
      },
    ];
  }
}
