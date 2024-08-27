import { Injectable } from '@angular/core';
import { ITag, ITagColor, TagColors } from '../interfaces/itag';

@Injectable({
  providedIn: 'root'
})
export class TagService {

  constructor() { }

  public createTag(newTagData: ITag): void {
    let tags = this.getTags();

    if (!tags) {
      tags = [newTagData];
    } else {
      tags.push(newTagData);
    }

    localStorage.setItem('tags', JSON.stringify(tags));
  }

  public getTags(): ITag[] {
    const tags = JSON.parse(localStorage.getItem('tags')!);
    return tags;
  }

  public getSingleTagColor(tagColor: TagColors): string {
    switch (tagColor) {
      case TagColors.LIGHT_RED:
        return '#E57373';
      case TagColors.MEDIUM_RED:
        return '#F44336';
      case TagColors.DARK_RED:
        return '#D32F2F';
      case TagColors.LIGHT_GREEN:
        return '#81C784';
      case TagColors.MEDIUM_GREEN:
        return '#4CAF50';
      case TagColors.DARK_GREEN:
        return '#388E3C';
      case TagColors.LIGHT_BLUE:
        return '#64B5F6';
      case TagColors.MEDIUM_BLUE:
        return '#2196F3';
      case TagColors.DARK_BLUE:
        return '#1976D2';
      default:
        throw new Error('Cannot return color code without color identifier');
    }
  }

  public getAllTagColors(): ITagColor[] {
    return [
      {
        id: TagColors.LIGHT_RED,
        name: "LIGHT_RED",
        color: '#E57373'
      },
      {
        id: TagColors.MEDIUM_RED,
        name: "MEDIUM_RED",
        color: '#F44336'
      },
      {
        id: TagColors.DARK_RED,
        name: "DARK_RED",
        color: '#D32F2F'
      },
      {
        id: TagColors.LIGHT_GREEN,
        name: "LIGHT_GREEN",
        color: '#81C784'
      },
      {
        id: TagColors.MEDIUM_GREEN,
        name: "MEDIUM_GREEN",
        color: '#4CAF50'
      },
      {
        id: TagColors.DARK_GREEN,
        name: "DARK_GREEN",
        color: '#388E3C'
      },
      {
        id: TagColors.LIGHT_BLUE,
        name: "LIGHT_BLUE",
        color: '#64B5F6'
      },
      {
        id: TagColors.MEDIUM_BLUE,
        name: "MEDIUM_BLUE",
        color: '#2196F3'
      },
      {
        id: TagColors.DARK_BLUE,
        name: "DARK_BLUE",
        color: '#1976D2'
      },
    ]
  }
}
