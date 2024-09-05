import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { INote } from 'src/app/utils/interfaces/inote';
import { OrderObject, OrderType } from 'src/app/utils/interfaces/iorder';
import { ITag, TagColors } from 'src/app/utils/interfaces/itag';
import { NoteService } from 'src/app/utils/services/note.service';
import { TagService } from 'src/app/utils/services/tag.service';
import { FilterObject } from './content-header/content-header.component';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.scss']
})
export class ManageComponent implements OnInit {

  @ViewChild('modalOverlayEl') modalOverlayEl!: ElementRef;
  @ViewChild('modalBlockEl') modalBlockEl!: ElementRef;

  public manageTypeIsTag: boolean = false;
  public viewMode!: ViewMode;
  public notes: INote[] = [];
  public showManageModal: boolean = false;
  public currentNote!: INote | ITag;
  public screenTop: number = 0;

  constructor(
    private noteService: NoteService,
    private tagService: TagService,
    private activatedRoute: ActivatedRoute
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
    this.loadNotes();
    this.getViewMode();
  }

  public loadNotes(): void {
    this.notes = this.noteService.getAllNotes();
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

  public loadFilteredNotes(filterObj: FilterObject): void {
    console.log(filterObj);

    this.notes = this.noteService.getFilteredNotes(filterObj.text, filterObj.tag);

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

  public orderNotes(orderObj: OrderObject): void {
    switch (orderObj.type) {
      case OrderType.NoteTitle:
        if (orderObj.value === 0) {
          this.notes = this.notes.sort((a, b) =>
            a.title.localeCompare(b.title));
        } else if (orderObj.value === 1) {
          this.notes = this.notes.sort((a, b) =>
            b.title.localeCompare(a.title));
        }
        break;
      case OrderType.TagName:
        break;
      case OrderType.CreatedAt:
        if (!this.manageTypeIsTag && orderObj.value === 0) {
          this.notes = this.notes.sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else if (!this.manageTypeIsTag && orderObj.value === 1) {
          this.notes = this.notes.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        break;
      default:
        break;
    }

    console.log(this.notes);
  }
}

export enum ViewMode {
  LIST,
  GRID,
}
