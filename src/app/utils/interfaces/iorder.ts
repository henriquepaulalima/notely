export interface IOrder {
  noteTitle: OrderType;
  tagName: OrderType;
  createdAt: OrderType;
}

export enum OrderType {
  ASC,
  DESC,
}
