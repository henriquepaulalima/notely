export interface ITag {
  id: string;
  name: string;
  color: TagColors;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITagColor {
  id: TagColors;
  name: string;
  color: string;
}

export enum TagColors {
  PETERRIVER,
  EMERALD,
  TURQUOISE,
  AMBER,
  CARROT,
  ALIZARIN,
  AMETHYST,
  CONCRETE,
  WETASPHALT
}
