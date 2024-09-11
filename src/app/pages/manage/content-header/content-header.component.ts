import { Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import { OrderObject, OrderType, OrderValue } from 'src/app/utils/interfaces/iorder';
import { ITag, TagColors } from 'src/app/utils/interfaces/itag';
import { TagService } from 'src/app/utils/services/tag.service';
import { ViewMode } from '../manage.component';

const body = document.querySelector('body');

@Component({
  selector: 'app-content-header',
  templateUrl: './content-header.component.html',
  styleUrls: ['./content-header.component.scss']
})
export class ContentHeaderComponent implements OnInit {

  @Input() manageTypeIsTag: boolean = false;
  @Input() viewMode!: ViewMode;

  @Output() viewModeChanged: EventEmitter<void> = new EventEmitter<void>();
  @Output() filterList: EventEmitter<FilterObject> = new EventEmitter<FilterObject>();
  @Output() sendNewOrder: EventEmitter<OrderObject> = new EventEmitter<OrderObject>();

  @ViewChild('modalOverlayEl') modalOverlayEl!: ElementRef;
  @ViewChild('modalBlockEl') modalBlockEl!: ElementRef;

  public showOptionsModal: boolean = false;
  public listOrder!: FormGroup;
  public searchTextInput: FormControl<string | null> = new FormControl<string | null>(null);
  public filterTagInput: FormControl<ITag | null> = new FormControl<ITag | null>(null);
  public tags: ITag[] = [];
  public screenTop: number = 0;
  public activeOrderType!: OrderType;

  constructor(
    private renderer: Renderer2,
    private tagService: TagService
  ) {
    this.renderer.listen('window', 'click', (event: Event) => {
      if (event.target === this.modalOverlayEl?.nativeElement) {
        this.toggleOptionsModal();
      }
    })
  }

  ngOnInit(): void {
    this.searchTextInput = new FormControl<string>('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20)
    ]);

    this.filterTagInput = new FormControl<ITag | null>(null, [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20)
    ]);

    this.listOrder = new FormGroup({
      noteTitle: new FormControl<OrderValue>(OrderValue.ASC),
      tagName: new FormControl<OrderValue>(OrderValue.ASC),
      createdAt: new FormControl<OrderValue>(OrderValue.ASC),
    });

    this.tags = this.tagService.getAllTags();
    if (!this.tags) this.tags = [];
  }

  get noteTitle(): AbstractControl<OrderValue> | null | undefined {
    return this.listOrder.get('noteTitle');
  }

  get tagName(): AbstractControl<OrderValue> | null | undefined {
    return this.listOrder.get('tagName');
  }

  get createdAt(): AbstractControl<OrderValue> | null | undefined {
    return this.listOrder.get('createdAt');
  }

  public toggleOptionsModal(): void {
    this.screenTop = document.documentElement.scrollTop;
    if (this.showOptionsModal) {
      this.modalBlockEl.nativeElement.classList.add('close');
      setTimeout(() => {
        this.showOptionsModal = false;
        if (body) body.style.overflow = 'scroll';
      }, 500);
    } else {
      this.showOptionsModal = true;
      if (body) body.style.overflow = 'hidden';
    }
  }

  public changeViewMode(): void {
    if (this.viewMode === ViewMode.LIST) {
      this.viewMode = ViewMode.GRID;
    } else {
      this.viewMode = ViewMode.LIST;
    }
    localStorage.setItem('viewMode', this.viewMode.toString());
    this.viewModeChanged.emit();
  }

  public changeOrder(field: AbstractControl<OrderValue> | null | undefined): void {
    switch (field?.value) {
      case 0:
        field.setValue(1);
        break;
      case 1:
        field.setValue(0);
        break;
      default:
        throw new Error(`Invalid field value: ${field?.value}`);
    }

    let orderType: OrderType;

    switch (field) {
      case this.noteTitle:
        orderType = OrderType.NoteTitle;
        break;
      case this.tagName:
        orderType = OrderType.TagName;
        break;
      case this.createdAt:
        orderType = OrderType.CreatedAt;
        break;
      default:
        throw new Error(`Invalid field value: ${field?.value}`);
    }

    this.activeOrderType = orderType;

    this.sendNewOrder.emit({
      type: orderType,
      value: field.value
    });
  }

  public getTagColor(tagColor: TagColors): string {
    return this.tagService.getSingleTagColor(tagColor);
  }

  public filterByTag(tag: ITag): void {
    this.toggleOptionsModal();

    setTimeout(() => {
      if (this.filterTagInput.value === tag) {
        this.filterTagInput.setValue(null);
      } else {
        this.filterTagInput.setValue(tag);
      }

      this.filterList.emit({
        text: this.searchTextInput.value,
        tag: this.filterTagInput.value
      });
    }, 500);
  }

  public sendSearchInputValue(): void {
    this.filterList.emit({
      text: this.searchTextInput.value,
      tag: this.filterTagInput.value
    });
  }

  public clearSearchInput(): void {
    this.searchTextInput.setValue(null);
    this.sendSearchInputValue();
  }
}

export interface FilterObject {
  text: string | null;
  tag?: ITag | null;
}
