import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { CreateComponent } from './pages/create/create.component';
import { HeaderComponent } from './common/header/header.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TextareaAutoresizeDirective } from './utils/directives/textarea-autoresize.directive';
import { TypeToggleComponent } from './common/type-toggle/type-toggle.component';
import { ManageComponent } from './pages/manage/manage.component';
import { ContentHeaderComponent } from './pages/manage/content-header/content-header.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CreateComponent,
    HeaderComponent,
    TextareaAutoresizeDirective,
    TypeToggleComponent,
    ManageComponent,
    ContentHeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
