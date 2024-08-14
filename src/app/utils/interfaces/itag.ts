export interface ITag {
  id: string;
  name: string;
  color: TagColors;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum TagColors {
  LIGHT_RED,
  MEDIUM_RED,
  DARK_RED,
  LIGHT_GREEN,
  MEDIUM_GREEN,
  DARK_GREEN,
  LIGHT_BLUE,
  MEDIUM_BLUE,
  DARK_BLUE
}
