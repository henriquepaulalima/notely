import { Renderer2 } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ITag, TagColors } from 'src/app/utils/interfaces/itag';
import { DataService } from 'src/app/utils/services/data.service';
import { TagService } from 'src/app/utils/services/tag.service';
import { ContentHeaderComponent } from './content-header.component';

describe('ContentHeaderComponent tag filter', () => {
  it('shows tags loaded when a guest signs in', () => {
    const tags: ITag[] = [];
    const renderer = { listen: () => () => {} } as unknown as Renderer2;
    const tagService = { getAllTags: () => [...tags] } as unknown as TagService;
    const changed = new BehaviorSubject<void>(undefined);
    const data = { changed } as DataService;
    const component = new ContentHeaderComponent(renderer, tagService, data);
    component.reloadTagList = new Subject<void>();
    component.ngOnInit();
    expect(component.tags).toEqual([]);

    tags.push({
      id: 'a0a37d22-a541-49e6-81ba-1c17469452f5', name: 'Guest tag',
      color: TagColors.EMERALD, active: true, createdAt: new Date(), updatedAt: new Date(),
    });
    changed.next();

    expect(component.tags).toEqual(tags);
    component.ngOnDestroy();
  });
});
