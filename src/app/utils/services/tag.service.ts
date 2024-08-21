import { Injectable } from '@angular/core';
import { ITag } from '../interfaces/itag';

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
}
