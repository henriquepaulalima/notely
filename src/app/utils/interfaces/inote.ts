import { ITag } from "./itag";

export interface INote {
  id: string;
  title: string;
  content: string;
  tags: ITag[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
