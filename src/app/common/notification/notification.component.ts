import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { INotification } from 'src/app/utils/interfaces/inotification';
import { NotificationService } from 'src/app/utils/services/notification.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit {
  public notifications: INotification[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.addNewNotification.subscribe((notification) => {
      if (notification) this.notify(notification);
    });
  }

  public notify(notification: INotification): void {
    this.notifications.push(notification);

    setTimeout(() => {
      this.hide(notification);
    }, 5000);
  }

  public hide(notification: INotification): void {
    document.getElementById(notification.id)?.classList.add('hide');
    setTimeout(() => {
      const notificationIndex = this.notifications.indexOf(notification, 0);
      this.notifications.splice(notificationIndex, 1);
    }, 1000);
  }

  public getStyle(notification: INotification, index: number): object {
    return {
      'background-color': notification.type === 0 ? '#2ECC71' : '#E74C3C',
      top: (index + 0.5) * 16 + '%',
    };
  }
}
