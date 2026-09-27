import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';
import { DataService } from './utils/services/data.service';
import { AuthComponent } from './common/auth/auth.component';
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
import { ManageModalComponent } from './pages/manage/manage-modal/manage-modal.component';
import { NotificationComponent } from './common/notification/notification.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CreateComponent,
    HeaderComponent,
    TextareaAutoresizeDirective,
    TypeToggleComponent,
    ManageComponent,
    ContentHeaderComponent,
    ManageModalComponent,
    NotificationComponent,
    AuthComponent,
  ],
  imports: [HttpClientModule, BrowserModule, AppRoutingModule, ReactiveFormsModule, FormsModule],
  providers: [{ provide: APP_INITIALIZER, useFactory: (data: DataService) => () => data.bootstrap(), deps: [DataService], multi: true }],
  bootstrap: [AppComponent],
})
export class AppModule {}
