export interface IOrder {
  noteTitle: OrderType;
  tagName: OrderType;
  createdAt: OrderType;
}

export interface OrderObject {
  type: OrderType,
  value: OrderValue
}

export enum OrderType {
  NoteTitle,
  TagName,
  CreatedAt
}

export enum OrderValue {
  ASC,
  DESC,
}
