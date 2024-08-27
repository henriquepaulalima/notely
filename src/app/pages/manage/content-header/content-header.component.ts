import { Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import { OrderType } from 'src/app/utils/interfaces/iorder';
import { ITag, TagColors } from 'src/app/utils/interfaces/itag';
import { TagService } from 'src/app/utils/services/tag.service';
import { ViewMode } from '../manage.component';

@Component({
  selector: 'app-content-header',
  templateUrl: './content-header.component.html',
  styleUrls: ['./content-header.component.scss']
})
export class ContentHeaderComponent implements OnInit {

  @Input() createTypeIsTag: boolean = false;

  @Output() viewModeValue: EventEmitter<ViewMode> = new EventEmitter();
  @Output() searchTextInputValue: EventEmitter<string> = new EventEmitter();

  @ViewChild('modalOverlayEl') modalOverlayEl!: ElementRef;
  @ViewChild('modalBlockEl') modalBlockEl!: ElementRef;

  public showOptionsModal: boolean = false;
  public viewMode: ViewMode = ViewMode.LIST;
  public listOrder!: FormGroup;
  public searchTextInput!: FormControl<string | null>;
  public filterTagInput!: FormControl<ITag | null>;
  public tags: ITag[] = [];

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
      noteTitle: new FormControl<OrderType>(OrderType.ASC),
      tagName: new FormControl<OrderType>(OrderType.ASC),
      createdAt: new FormControl<OrderType>(OrderType.ASC),
    });

    this.tags = this.tagService.getTags();
  }

  get noteTitle(): AbstractControl<any, any> | null | undefined {
    return this.listOrder.get('noteTitle');
  }

  get tagName(): AbstractControl<any, any> | null | undefined {
    return this.listOrder.get('tagName');
  }

  get createdAt(): AbstractControl<any, any> | null | undefined {
    return this.listOrder.get('createdAt');
  }

  public toggleOptionsModal(): void {
    if (this.showOptionsModal) {
      this.modalBlockEl.nativeElement.classList.add('close');
      setTimeout(() => {
        this.showOptionsModal = false;
      }, 500);
    } else {
      this.showOptionsModal = true;
    }
  }

  public changeViewMode(): void {
    if (this.viewMode === ViewMode.LIST) {
      this.viewMode = ViewMode.GRID;
    } else {
      this.viewMode = ViewMode.LIST;
    }
    this.viewModeValue.emit(this.viewMode);
  }

  public changeOrder(field: AbstractControl<any, any> | null | undefined): void {
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
  }

  public getTagColor(tagColor: TagColors): string {
    return this.tagService.getSingleTagColor(tagColor);
  }

  public filterByTag(tag: ITag): void {
    if (this.filterTagInput.value === tag) {
      this.filterTagInput.setValue(null);
    } else {
      this.filterTagInput.setValue(tag);
    }
  }

  public sendSearchInputValue(): void {
    let input = '';
    if (this.searchTextInput?.value) input = this.searchTextInput.value;
    this.searchTextInputValue.emit(input);
  }
}
