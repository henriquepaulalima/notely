import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { INote } from 'src/app/utils/interfaces/inote';
import { OrderObject, OrderType } from 'src/app/utils/interfaces/iorder';
import { ITag, TagColors } from 'src/app/utils/interfaces/itag';
import { NoteService } from 'src/app/utils/services/note.service';
import { TagService } from 'src/app/utils/services/tag.service';
import { FilterObject } from './content-header/content-header.component';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.scss'],
})
export class ManageComponent implements OnInit {
  @ViewChild('modalOverlayEl') modalOverlayEl!: ElementRef;
  @ViewChild('modalBlockEl') modalBlockEl!: ElementRef;

  public manageTypeIsTag: boolean = false;
  public viewMode!: ViewMode;
  public notes: INote[] = [];
  public tags: ITag[] = [];
  public showManageModal: boolean = false;
  public currentNote!: INote | ITag;
  public screenTop: number = 0;
  public reloadContentHeaderTagList = new Subject<void>();

  constructor(
    private noteService: NoteService,
    private tagService: TagService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.activatedRoute.paramMap.subscribe((params: ParamMap) => {
      const type = params.get('type');

      if (type === 'note') {
        this.manageTypeIsTag = false;
      } else if (type === 'tag') {
        this.manageTypeIsTag = true;
      }
    });
  }

  ngOnInit(): void {
    this.loadList(false);

    this.getViewMode();
  }

  public loadList(reload: boolean): void {
    if (reload && this.manageTypeIsTag) {
      this.tags = this.tagService.getAllTags();
      this.reloadContentHeaderTagList.next();
    } else if (reload && !this.manageTypeIsTag) {
      this.notes = this.noteService.getAllNotes();
    } else if (!reload) {
      this.tags = this.tagService.getAllTags();
      this.notes = this.noteService.getAllNotes();
    }
  }

  public getViewMode(): void {
    const storageViewMode = localStorage.getItem('viewMode');
    if (storageViewMode) {
      this.viewMode = parseInt(storageViewMode);
    } else {
      this.viewMode = ViewMode.LIST;
    }
  }

  public setNewViewMode(): void {
    this.getViewMode();
  }

  public loadFilteredList(filterObj: FilterObject): void {
    if (this.manageTypeIsTag) {
      this.tags = this.tagService.getFilteredTags(filterObj.text);
    } else {
      this.notes = this.noteService.getFilteredNotes(
        filterObj.text,
        filterObj.tag,
      );
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  public getTagColor(tagColor: TagColors): string {
    return this.tagService.getSingleTagColor(tagColor);
  }

  public toggleManageModal(data?: INote | ITag): void {
    if (!this.showManageModal && data) {
      this.screenTop = document.documentElement.scrollTop;
      this.currentNote = data;
      this.showManageModal = true;
    } else {
      this.showManageModal = false;
    }
  }

  public orderList(orderObj: OrderObject): void {
    switch (orderObj.type) {
      case OrderType.NoteTitle:
        if (orderObj.value === 0) {
          this.notes = this.notes.sort((a, b) =>
            a.title.localeCompare(b.title),
          );
        } else if (orderObj.value === 1) {
          this.notes = this.notes.sort((a, b) =>
            b.title.localeCompare(a.title),
          );
        }
        break;
      case OrderType.TagName:
        if (orderObj.value === 0) {
          this.tags = this.tags.sort((a, b) => a.name.localeCompare(b.name));
        } else if (orderObj.value === 1) {
          this.tags = this.tags.sort((a, b) => b.name.localeCompare(a.name));
        }
        break;
      case OrderType.CreatedAt:
        if (!this.manageTypeIsTag && orderObj.value === 0) {
          this.notes = this.notes.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        } else if (!this.manageTypeIsTag && orderObj.value === 1) {
          this.notes = this.notes.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        } else if (this.manageTypeIsTag && orderObj.value === 0) {
          this.tags = this.tags.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        } else if (this.manageTypeIsTag && orderObj.value === 1) {
          this.tags = this.tags.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        }
        break;
      default:
        break;
    }
  }
}

export enum ViewMode {
  LIST,
  GRID,
}
