import { Component, OnInit } from '@angular/core';
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
    const element = document.getElementById(notification.id);
    if (element?.classList.contains('hide')) return;
    element?.classList.add('hide');
    setTimeout(() => {
      const notificationIndex = this.notifications.indexOf(notification, 0);
      if (notificationIndex >= 0) this.notifications.splice(notificationIndex, 1);
    }, 220);
  }
}
