import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, UrlSegment } from '@angular/router';

@Component({
  selector: 'app-type-toggle',
  templateUrl: './type-toggle.component.html',
  styleUrls: ['./type-toggle.component.scss']
})
export class TypeToggleComponent implements OnInit {

  @Output() routeChanged: EventEmitter<void> = new EventEmitter<void>();

  public typeIsTag: FormControl<boolean | null> = new FormControl<boolean | null>(null);
  public currentPage!: string;

  constructor(
    private router: Router,
    private activetedRouter: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.activetedRouter.paramMap.subscribe((params: ParamMap) => {
      if (params.get('type') === 'note') {
        this.typeIsTag.setValue(false);
      } else if (params.get('type') === 'tag') {
        this.typeIsTag.setValue(true);
      }
    })

    this.activetedRouter.url.subscribe((url: UrlSegment[]) => {
      this.currentPage = url[0].path;
    })
  }

  public handleInputChange(): void {
    if (this.typeIsTag.value) {
      this.router.navigate([this.currentPage, 'note']);
      this.routeChanged.emit();
    } else {
      this.router.navigate([this.currentPage, 'tag']);
      this.routeChanged.emit();
    }
  }
}
