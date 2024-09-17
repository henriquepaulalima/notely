export interface INotification {
  id: string,
  type: NotificationType,
  message: string
}

export enum NotificationType {
  SUCCESS,
  ERROR
}
