import { Injectable } from '@angular/core';
import { ITag, ITagColor, TagColors } from '../interfaces/itag';

@Injectable({
  providedIn: 'root'
})
export class TagService {

  constructor() { }

  public createTag(newTagData: ITag): void {
    let tags = this.getAllTags();

    if (!tags) {
      tags = [newTagData];
    } else {
      tags.push(newTagData);
    }

    localStorage.setItem('tags', JSON.stringify(tags));
  }

  public getAllTags(): ITag[] {
    const tags = JSON.parse(localStorage.getItem('tags')!);
    return tags;
  }

  public getSingleTagColor(tagColor: TagColors): string {
    switch (tagColor) {
      case TagColors.PETERRIVER:
        return '#3498DB';
      case TagColors.EMERALD:
        return '#2ECC71';
      case TagColors.TURQUOISE:
        return '#1ABC9C';
      case TagColors.AMBER:
        return '#F0A30A';
      case TagColors.CARROT:
        return '#E67E22';
      case TagColors.ALIZARIN:
        return '#E74C3C';
      case TagColors.AMETHYST:
        return '#9B59B6';
      case TagColors.CONCRETE:
        return '#95A5A6';
      case TagColors.WETASPHALT:
        return '#34495E';
      default:
        throw new Error('Cannot return color code without color identifier');
    }
  }

  public getAllTagColors(): ITagColor[] {
    return [
      {
        id: TagColors.PETERRIVER,
        name: 'PETERRIVER',
        color: '#3498DB'
      },
      {
        id: TagColors.EMERALD,
        name: 'EMERALD',
        color: '#2ECC71'
      },
      {
        id: TagColors.TURQUOISE,
        name: 'TURQUOISE',
        color: '#1ABC9C'
      },
      {
        id: TagColors.AMBER,
        name: 'AMBER',
        color: '#F0A30A'
      },
      {
        id: TagColors.CARROT,
        name: 'CARROT',
        color: '#E67E22'
      },
      {
        id: TagColors.ALIZARIN,
        name: 'ALIZARIN',
        color: '#E74C3C'
      },
      {
        id: TagColors.AMETHYST,
        name: 'AMETHYST',
        color: '#9B59B6'
      },
      {
        id: TagColors.CONCRETE,
        name: 'CONCRETE',
        color: '#95A5A6'
      },
      {
        id: TagColors.WETASPHALT,
        name: 'WETASPHALT',
        color: '#34495E'
      },
    ]
  }
}
