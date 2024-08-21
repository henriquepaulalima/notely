import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-type-toggle',
  templateUrl: './type-toggle.component.html',
  styleUrls: ['./type-toggle.component.scss']
})
export class TypeToggleComponent {

  @Output() typeToggleValue = new EventEmitter<boolean>(false);

  public typeIsTag: FormControl<boolean | null> = new FormControl(false);

  constructor() { }

  public handleInputChange(): void {
    if (this.typeIsTag.value != null) this.typeToggleValue.emit(this.typeIsTag.value);
  }

}
