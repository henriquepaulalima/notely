import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { INotification } from '../interfaces/inotification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  public addNewNotification = new BehaviorSubject<INotification | null>(null);

  constructor() { }

  public createNewNotification(notification: INotification): void {
    this.addNewNotification.next(notification);
  }
}
