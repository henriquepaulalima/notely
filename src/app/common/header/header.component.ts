import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @ViewChild('dropdown') dropdown!: ElementRef;

  public iconUrl: string = 'bars-solid.svg';
  public showMenu: boolean = false;

  constructor(private router: Router) {}

  public toggleMenu(): void {
    if (this.showMenu) {
      this.iconUrl = 'bars-solid.svg';
    } else {
      this.iconUrl = 'xmark-solid.svg'
    }
    this.showMenu = !this.showMenu;
  }

  public navigateTo(url: string): void {
    if (this.showMenu) {
      this.toggleMenu();
      if (document.location.pathname != url) this.router.navigate([url]);
    }
  }
}
