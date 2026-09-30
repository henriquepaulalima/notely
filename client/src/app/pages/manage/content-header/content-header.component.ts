import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
} from '@angular/forms';
import {
  OrderObject,
  OrderType,
  OrderValue,
} from 'src/app/utils/interfaces/iorder';
import { ITag, TagColors } from 'src/app/utils/interfaces/itag';
import { TagService } from 'src/app/utils/services/tag.service';
import { DataService } from 'src/app/utils/services/data.service';
import { ViewMode } from '../manage.component';
import { Subject, Subscription } from 'rxjs';

const body = document.querySelector('body');

@Component({
  selector: 'app-content-header',
  templateUrl: './content-header.component.html',
  styleUrls: ['./content-header.component.scss'],
})
export class ContentHeaderComponent implements OnInit, OnChanges, OnDestroy {
  @Input() manageTypeIsTag: boolean = false;
  @Input() viewMode!: ViewMode;
  @Input() searchText: string | null = '';
  @Input() reloadTagList!: Subject<void>;
  @Output() viewModeChanged = new EventEmitter<void>();
  @Output() filterList = new EventEmitter<FilterObject>();
  @Output() sendNewOrder = new EventEmitter<OrderObject>();
  @ViewChild('modalOverlayEl') modalOverlayEl!: ElementRef;
  @ViewChild('modalBlockEl') modalBlockEl!: ElementRef;

  public showOptionsModal: boolean = false;
  public isClosing: boolean = false;
  public listOrder!: FormGroup;
  public searchTextInput = new FormControl<string | null>(null);
  public filterTagInput = new FormControl<ITag | null>(null);
  public tags: ITag[] = [];
  public screenTop: number = 0;
  public activeOrderType!: OrderType;
  private subscriptions = new Subscription();

  constructor(
    private renderer: Renderer2,
    private tagService: TagService,
    private data: DataService,
  ) {
    this.renderer.listen('window', 'click', (event: Event) => {
      if (event.target === this.modalOverlayEl?.nativeElement) {
        this.toggleOptionsModal();
      }
    });
  }

  ngOnInit(): void {
    this.searchTextInput = new FormControl<string | null>(this.searchText, [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20),
    ]);

    this.filterTagInput = new FormControl<ITag | null>(null, [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20),
    ]);

    this.listOrder = new FormGroup({
      noteTitle: new FormControl<OrderValue>(OrderValue.ASC),
      tagName: new FormControl<OrderValue>(OrderValue.ASC),
      createdAt: new FormControl<OrderValue>(OrderValue.ASC),
    });

    this.loadTagList();

    this.subscriptions.add(this.reloadTagList.subscribe(() => this.loadTagList()));
    this.subscriptions.add(this.data.changed.subscribe(() => this.loadTagList()));
  }

  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }

  ngOnChanges(changes: SimpleChanges): void {
    const viewChange = changes['manageTypeIsTag'];
    if (viewChange && !viewChange.firstChange && this.searchTextInput) {
      this.searchTextInput.setValue(this.searchText);
    }
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

  public loadTagList(): void {
    this.tags = this.tagService.getAllTags();
    const selected = this.filterTagInput.value;
    if (selected) {
      const current = this.tags.find(tag => tag.id === selected.id) || null;
      this.filterTagInput.setValue(current);
      if (!current) this.sendSearchInputValue();
    }
  }

  public toggleOptionsModal(): void {
    if (this.isClosing) return;
    this.screenTop = document.documentElement.scrollTop;
    if (this.showOptionsModal) {
      this.isClosing = true;
      setTimeout(() => {
        this.showOptionsModal = false;
        this.isClosing = false;
        if (body) body.style.overflow = 'scroll';
      }, 250);
    } else {
      this.isClosing = false;
      this.showOptionsModal = true;
      if (body) body.style.overflow = 'hidden';
    }
  }

  public changeViewMode(event: Event): void {
    this.viewMode = (event.target as HTMLInputElement).checked
      ? ViewMode.GRID
      : ViewMode.LIST;
    localStorage.setItem('viewMode', this.viewMode.toString());
    this.viewModeChanged.emit();
  }

  public changeOrder(
    field: AbstractControl<OrderValue> | null | undefined,
  ): void {
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
      value: field.value,
    });
  }

  public getTagColor(tagColor: TagColors): string {
    return this.tagService.getSingleTagColor(tagColor);
  }

  public filterByTag(tag: ITag): void {
    if (this.filterTagInput.value?.id === tag.id) {
      this.filterTagInput.setValue(null);
    } else {
      this.filterTagInput.setValue(tag);
    }

    this.filterList.emit({
      text: this.searchTextInput.value,
      tag: this.filterTagInput.value,
    });
    this.toggleOptionsModal();
  }

  public sendSearchInputValue(): void {
    this.filterList.emit({
      text: this.searchTextInput.value,
      tag: this.filterTagInput.value,
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
